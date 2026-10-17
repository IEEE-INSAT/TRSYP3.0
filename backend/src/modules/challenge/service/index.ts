import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ArucoWordProgress, Prisma, TeamActivity } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { DEFAULT_SCAN_LIMIT, MAX_ATTEMPTS, matchesAnswer, toMarker } from '../aruco.data';
import {
  ArucoMarkerResult,
  ArucoScansResult,
  ArucoStateResult,
  ArucoWordStatusResult,
  ArucoWordSubmitResult,
} from '../domain';

/** The live round, with what its game sets: its tries per team, and whether it has a word. */
type Round = { id: string; game: number; scanLimit: number | null; hasWord: boolean };
type Team = { id: string; name: string };

function toWordStatus(
  teamName: string,
  progress: Pick<ArucoWordProgress, 'solved' | 'attempts'> | null,
): ArucoWordStatusResult {
  const solved = progress?.solved ?? false;
  const attempts = progress?.attempts ?? 0;
  return {
    teamName,
    solved,
    attempts,
    attemptsLeft: solved ? 0 : Math.max(0, MAX_ATTEMPTS - attempts),
  };
}

@Injectable()
export class ChallengeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  /** Open while the admin portal has a round live. */
  async state(): Promise<ArucoStateResult> {
    return { open: (await this.findLiveRound()) !== null };
  }

  /**
   * Tries per team in a round: the game's own limit (Mine games: 6), else
   * ARUCO_SCAN_LIMIT, read per request, else the default.
   */
  scanLimit(round?: Round): number {
    if (round?.scanLimit) return round.scanLimit;
    const n = Number(this.config.get('ARUCO_SCAN_LIMIT'));
    return Number.isInteger(n) && n > 0 ? n : DEFAULT_SCAN_LIMIT;
  }

  /** The team's tries in the live round and its field log, as each marker showed. */
  async scans(userId: string): Promise<ArucoScansResult> {
    const round = await this.liveRound();
    const team = await this.playingTeam(userId, round);
    const tried = await this.prisma.arucoScan.findMany({
      where: { roundId: round.id, teamId: team.id },
      orderBy: { createdAt: 'asc' },
    });
    const found = tried.flatMap((scan) => toMarker(scan) ?? []);
    return { teamName: team.name, used: tried.length, limit: this.scanLimit(round), found };
  }

  /**
   * What scanning a marker reveals in the live round's game. Each new ID a
   * team tries - real or not - uses one of its tries (see scanLimit);
   * reopening one it already tried is free. Every lookup is logged.
   */
  async marker(userId: string, id: number): Promise<ArucoMarkerResult> {
    const round = await this.liveRound();
    const team = await this.playingTeam(userId, round);
    const limit = this.scanLimit(round);
    const row = await this.prisma.arucoMarker.findUnique({
      where: { game_markerId: { game: round.game, markerId: id } },
    });
    const marker = row ? toMarker(row) : null;
    const scope = { roundId: round.id, teamId: team.id };
    const logScan = (outcome: string) =>
      this.log(round, team, userId, { action: 'scan', markerId: id, outcome, content: row?.content ?? '' });

    const already = await this.prisma.arucoScan.findUnique({
      where: { roundId_teamId_markerId: { ...scope, markerId: id } },
    });
    if (!already) {
      const before = await this.prisma.arucoScan.count({ where: scope });
      if (before >= limit) {
        await logScan('limit');
        this.throwScanLimit(limit);
      }

      let created = false;
      try {
        // A snapshot of what it showed, so the field log never changes under the team.
        await this.prisma.arucoScan.create({
          data: { ...scope, markerId: id, kind: row?.kind ?? null, content: row?.content ?? '', hintNumber: row?.hintNumber ?? null },
        });
        created = true;
      } catch (err) {
        // A teammate tried the same ID at the same moment: it's recorded once.
        if (!(err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002')) throw err;
      }

      // Two different new IDs racing for the last try: whoever overshoots gives it back.
      const after = await this.prisma.arucoScan.count({ where: scope });
      if (created && after > limit) {
        await this.prisma.arucoScan.deleteMany({ where: { ...scope, markerId: id } });
        await logScan('limit');
        this.throwScanLimit(limit);
      }
    }

    await logScan(marker?.kind ?? 'none');
    const scansUsed = await this.prisma.arucoScan.count({ where: scope });
    if (!marker) {
      throw new NotFoundException({
        statusCode: 404,
        error: 'Not Found',
        code: 'NO_MARKER',
        message: `No marker with ID ${id}`,
        scansUsed,
        scanLimit: limit,
      });
    }
    return { ...marker, scansUsed, scanLimit: limit };
  }

  /** The team's word attempts in the live round. */
  async wordStatus(userId: string): Promise<ArucoWordStatusResult> {
    const round = await this.liveRound();
    this.assertHasWord(round);
    const team = await this.playingTeam(userId, round);
    const progress = await this.prisma.arucoWordProgress.findUnique({
      where: { roundId_teamId: { roundId: round.id, teamId: team.id } },
    });
    return toWordStatus(team.name, progress);
  }

  /**
   * Checks the word against the live round's game and records the attempt
   * against the team. Once solved, or once all attempts are spent, further
   * submissions are not counted - the current state is returned with
   * `correct` reflecting only whether it's solved. Every word typed is logged.
   */
  async submitWord(userId: string, answer: string): Promise<ArucoWordSubmitResult> {
    const round = await this.liveRound();
    this.assertHasWord(round);
    const team = await this.playingTeam(userId, round);
    const game = await this.prisma.arucoGame.findUniqueOrThrow({ where: { number: round.game } });
    const key = { roundId_teamId: { roundId: round.id, teamId: team.id } };

    await this.prisma.arucoWordProgress.upsert({
      where: key,
      create: { roundId: round.id, teamId: team.id },
      update: {},
    });

    const correct = matchesAnswer(answer, game.word ?? '');

    // The attempt cap lives in the WHERE clause so two teammates submitting
    // at once can't both slip in under it.
    const { count } = await this.prisma.arucoWordProgress.updateMany({
      where: { roundId: round.id, teamId: team.id, solved: false, attempts: { lt: MAX_ATTEMPTS } },
      data: {
        attempts: { increment: 1 },
        ...(correct ? { solved: true, solvedAt: new Date() } : {}),
      },
    });

    await this.log(round, team, userId, {
      action: 'word',
      outcome: count === 0 ? 'locked' : correct ? 'correct' : 'wrong',
      content: answer.trim(),
    });

    const progress = await this.prisma.arucoWordProgress.findUnique({ where: key });
    const status = toWordStatus(team.name, progress);
    return { ...status, correct: count > 0 ? correct : status.solved };
  }

  private log(
    round: Round,
    team: Team,
    userId: string,
    event: { action: string; outcome: string; content: string; markerId?: number },
  ) {
    return this.prisma.arucoEvent.create({ data: { roundId: round.id, teamId: team.id, userId, ...event } });
  }

  private async findLiveRound(): Promise<Round | null> {
    const round = await this.prisma.arucoRound.findFirst({
      where: { endedAt: null },
      select: { id: true, game: true, arucoGame: { select: { scanLimit: true, word: true } } },
    });
    if (!round) return null;
    return { id: round.id, game: round.game, scanLimit: round.arucoGame.scanLimit, hasWord: !!round.arucoGame.word };
  }

  /** Mine games have no word to submit. */
  private assertHasWord(round: Round) {
    if (!round.hasWord) {
      throw new ForbiddenException({
        statusCode: 403,
        error: 'Forbidden',
        code: 'NO_WORD',
        message: 'This game has no word to submit.',
      });
    }
  }

  private async liveRound(): Promise<Round> {
    const round = await this.findLiveRound();
    if (!round) {
      throw new ForbiddenException({
        statusCode: 403,
        error: 'Forbidden',
        code: 'ARUCO_CLOSED',
        message: 'The ArUco challenge is closed.',
      });
    }
    return round;
  }

  private throwScanLimit(limit: number): never {
    throw new ForbiddenException({
      statusCode: 403,
      error: 'Forbidden',
      code: 'SCAN_LIMIT_REACHED',
      message: `Your team has used all ${limit} marker tries.`,
      scansUsed: limit,
      scanLimit: limit,
    });
  }

  /**
   * Scans and word attempts belong to the team: the user's Competition team,
   * which must be one the live round was started for.
   */
  private async playingTeam(userId: string, round: Round): Promise<Team> {
    const membership = await this.prisma.teamMembership.findFirst({
      where: { activity: TeamActivity.COMPETITION, participant: { userId } },
      select: { team: { select: { id: true, name: true } } },
    });
    if (!membership) {
      // `code` lets the page show a proper "join a team" state instead of the raw message.
      throw new ForbiddenException({
        statusCode: 403,
        error: 'Forbidden',
        code: 'NO_COMPETITION_TEAM',
        message: 'You need to be in a Competition team to play the ArUco challenge.',
      });
    }
    const playing = await this.prisma.arucoRoundTeam.findUnique({
      where: { roundId_teamId: { roundId: round.id, teamId: membership.team.id } },
    });
    if (!playing) {
      throw new ForbiddenException({
        statusCode: 403,
        error: 'Forbidden',
        code: 'NOT_PLAYING',
        message: 'Your team isn’t playing this game.',
      });
    }
    return membership.team;
  }
}
