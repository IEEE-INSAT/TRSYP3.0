import { Injectable } from '@nestjs/common';
import { ArucoProgress } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { MAX_ATTEMPTS, isCorrectAnswer } from '../aruco.data';
import { ArucoStatusResult, ArucoSubmitResult } from '../domain';

function toStatus(progress: Pick<ArucoProgress, 'solved' | 'attempts'> | null): ArucoStatusResult {
  const solved = progress?.solved ?? false;
  const attempts = progress?.attempts ?? 0;
  return {
    solved,
    attempts,
    attemptsLeft: solved ? 0 : Math.max(0, MAX_ATTEMPTS - attempts),
  };
}

@Injectable()
export class ChallengeService {
  constructor(private readonly prisma: PrismaService) {}

  /** The signed-in account's progress on the collector (marker 4). */
  async status(userId: string): Promise<ArucoStatusResult> {
    const progress = await this.prisma.arucoProgress.findUnique({ where: { userId } });
    return toStatus(progress);
  }

  /**
   * Checks the word and records the attempt. Once solved, or once all
   * attempts are spent, further submissions are not counted - the current
   * state is returned with `correct` reflecting only whether it's solved.
   */
  async submit(userId: string, answer: string): Promise<ArucoSubmitResult> {
    await this.prisma.arucoProgress.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });

    const correct = isCorrectAnswer(answer);

    // The attempt cap lives in the WHERE clause so two concurrent submits
    // can't both slip in under it.
    const { count } = await this.prisma.arucoProgress.updateMany({
      where: { userId, solved: false, attempts: { lt: MAX_ATTEMPTS } },
      data: {
        attempts: { increment: 1 },
        ...(correct ? { solved: true, solvedAt: new Date() } : {}),
      },
    });

    const progress = await this.prisma.arucoProgress.findUnique({ where: { userId } });
    const status = toStatus(progress);
    return { ...status, correct: count > 0 ? correct : status.solved };
  }
}
