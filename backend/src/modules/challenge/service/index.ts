import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ArucoCollectorProgress, TeamActivity } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  CollectorNumber,
  MAX_ATTEMPTS,
  answerEnvKey,
  getMarker,
  isCollectorNumber,
  matchesAnswer,
} from '../aruco.data';
import {
  ArucoCollectorStatusResult,
  ArucoMarkerResult,
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

  /** What scanning a marker reveals. Hidden entirely while the challenge is closed. */
  marker(id: number): ArucoMarkerResult {
    this.assertOpen();
    const marker = getMarker(id);
    if (!marker) throw new NotFoundException(`No marker with ID ${id}`);
    return marker;
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
      throw new ServiceUnavailableException('This collector is not set up yet. Ask the organizers.');
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
    if (!this.isOpen()) throw new ForbiddenException('The ArUco challenge is closed.');
  }

  private assertCollector(collector: number): CollectorNumber {
    if (!isCollectorNumber(collector)) throw new NotFoundException(`No collector ${collector}`);
    return collector;
  }

  /** Collector attempts belong to the team: the user's Competition team. */
  private async competitionTeam(userId: string): Promise<{ id: string; name: string }> {
    const membership = await this.prisma.teamMembership.findFirst({
      where: { activity: TeamActivity.COMPETITION, participant: { userId } },
      select: { team: { select: { id: true, name: true } } },
    });
    if (!membership) {
      throw new ForbiddenException('You need to be in a Competition team to use the collectors.');
    }
    return membership.team;
  }
}
