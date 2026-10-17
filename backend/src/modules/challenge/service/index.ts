import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ArucoCollectorProgress, Prisma, TeamActivity } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  CollectorNumber,
  DEFAULT_SCAN_LIMIT,
  MAX_ATTEMPTS,
  answerEnvKey,
  isCollectorNumber,
  matchesAnswer,
  toMarker,
} from '../aruco.data';
import {
  ArucoCollectorStatusResult,
  ArucoMarkerResult,
  ArucoScansResult,
  ArucoStateResult,
  ArucoSubmitResult,
} from '../domain';

function toStatus(
  collector: CollectorNumber,
  teamName: string,
  progress: Pick<ArucoCollectorProgress, 'solved' | 'attempts'> | null,
): ArucoCollectorStatusResult {
  const solved = progress?.solved ?? false;
  const attempts = progress?.attempts ?? 0;
  return {
    collector,
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

  /** ARUCO_OPEN, read per request so opening/closing needs no rebuild. */
  isOpen(): boolean {
    return this.config.get<string>('ARUCO_OPEN') === 'true';
  }

  state(): ArucoStateResult {
    return { open: this.isOpen() };
  }

  /** ARUCO_SCAN_LIMIT, read per request; falls back to the default when unset or invalid. */
  scanLimit(): number {
    const n = Number(this.config.get('ARUCO_SCAN_LIMIT'));
    return Number.isInteger(n) && n > 0 ? n : DEFAULT_SCAN_LIMIT;
  }

  /** How many distinct marker IDs the user's team has tried. */
  async scans(userId: string): Promise<ArucoScansResult> {
    this.assertOpen();
    const team = await this.competitionTeam(userId);
    const tried = await this.prisma.arucoScan.findMany({
      where: { teamId: team.id },
      orderBy: { createdAt: 'asc' },
      select: { markerId: true },
    });

    // The team's field log: its real markers, as the register describes them
    // now, so every teammate sees the same log and an admin reset empties it.
    const rows = await this.prisma.arucoMarker.findMany({
      where: { markerId: { in: tried.map((t) => t.markerId) } },
    });
    const byId = new Map(rows.map((row) => [row.markerId, toMarker(row)]));
    const found = tried.flatMap((t) => byId.get(t.markerId) ?? []);

    return { teamName: team.name, used: tried.length, limit: this.scanLimit(), found };
  }

  /**
   * What scanning a marker reveals. Hidden entirely while the challenge is
   * closed. Each new ID a team tries - real or not - uses one of its
   * ARUCO_SCAN_LIMIT tries; re-opening an ID it already tried is free.
   */
  async marker(userId: string, id: number): Promise<ArucoMarkerResult> {
    this.assertOpen();
    const team = await this.competitionTeam(userId);
    const limit = this.scanLimit();
    const key = { teamId_markerId: { teamId: team.id, markerId: id } };

    const already = await this.prisma.arucoScan.findUnique({ where: key });
    if (!already) {
      const before = await this.prisma.arucoScan.count({ where: { teamId: team.id } });
      if (before >= limit) this.throwScanLimit(limit);

      let created = false;
      try {
        await this.prisma.arucoScan.create({ data: { teamId: team.id, markerId: id } });
        created = true;
      } catch (err) {
        // A teammate tried the same ID at the same moment: it's recorded once.
        if (!(err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002')) throw err;
      }

      // Two different new IDs racing for the last try: whoever overshoots gives it back.
      const after = await this.prisma.arucoScan.count({ where: { teamId: team.id } });
      if (created && after > limit) {
        await this.prisma.arucoScan.deleteMany({ where: { teamId: team.id, markerId: id } });
        this.throwScanLimit(limit);
      }
    }

    const scansUsed = await this.prisma.arucoScan.count({ where: { teamId: team.id } });
    // Read per scan: organizers reassign IDs from the admin portal mid-event.
    const row = await this.prisma.arucoMarker.findUnique({ where: { markerId: id } });
    const marker = row ? toMarker(row) : null;
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

  /** The team's progress on one collector. */
  async collectorStatus(userId: string, collector: number): Promise<ArucoCollectorStatusResult> {
    this.assertOpen();
    const n = this.assertCollector(collector);
    const team = await this.competitionTeam(userId);
    const progress = await this.prisma.arucoCollectorProgress.findUnique({
      where: { teamId_collector: { teamId: team.id, collector: n } },
    });
    return toStatus(n, team.name, progress);
  }

  /**
   * Checks the word and records the attempt against the team. Once solved,
   * or once all attempts are spent, further submissions are not counted -
   * the current state is returned with `correct` reflecting only whether
   * it's solved.
   */
  async submit(userId: string, collector: number, answer: string): Promise<ArucoSubmitResult> {
    this.assertOpen();
    const n = this.assertCollector(collector);
    const expected = this.config.get<string>(answerEnvKey(n))?.trim();
    if (!expected) {
      throw new ServiceUnavailableException({
        statusCode: 503,
        error: 'Service Unavailable',
        code: 'COLLECTOR_NOT_SET',
        message: 'This collector is not set up yet. Ask the organizers.',
      });
    }
    const team = await this.competitionTeam(userId);
    const key = { teamId_collector: { teamId: team.id, collector: n } };

    await this.prisma.arucoCollectorProgress.upsert({
      where: key,
      create: { teamId: team.id, collector: n },
      update: {},
    });

    const correct = matchesAnswer(answer, expected);

    // The attempt cap lives in the WHERE clause so two teammates submitting
    // at once can't both slip in under it.
    const { count } = await this.prisma.arucoCollectorProgress.updateMany({
      where: { teamId: team.id, collector: n, solved: false, attempts: { lt: MAX_ATTEMPTS } },
      data: {
        attempts: { increment: 1 },
        ...(correct ? { solved: true, solvedAt: new Date() } : {}),
      },
    });

    const progress = await this.prisma.arucoCollectorProgress.findUnique({ where: key });
    const status = toStatus(n, team.name, progress);
    return { ...status, correct: count > 0 ? correct : status.solved };
  }

  private assertOpen() {
    if (!this.isOpen()) {
      throw new ForbiddenException({
        statusCode: 403,
        error: 'Forbidden',
        code: 'ARUCO_CLOSED',
        message: 'The ArUco challenge is closed.',
      });
    }
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

  private assertCollector(collector: number): CollectorNumber {
    if (!isCollectorNumber(collector)) throw new NotFoundException(`No collector ${collector}`);
    return collector;
  }

  /** Scans and collector attempts belong to the team: the user's Competition team. */
  private async competitionTeam(userId: string): Promise<{ id: string; name: string }> {
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
    return membership.team;
  }
}
