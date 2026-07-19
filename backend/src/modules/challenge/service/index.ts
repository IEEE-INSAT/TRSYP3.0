import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { decodeRiddleCode } from '../riddle-code.util';
import { getRiddle, isCorrectAnswer } from '../riddles.data';
import { RiddleAccessResult, RiddleSubmitResult } from '../domain';

@Injectable()
export class ChallengeService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Decodes the code, looks up the riddle text, and returns/creates the
   * team's progress row for it. Called every time a team opens the page
   * with a code (including re-opening after already solving it).
   */
  async access(code: string): Promise<RiddleAccessResult> {
    const decoded = decodeRiddleCode(code);
    if (!decoded) {
      throw new BadRequestException('Invalid code');
    }

    const riddle = getRiddle(decoded.riddleNumber);
    if (!riddle) {
      throw new BadRequestException('Invalid code');
    }

    const team = await this.prisma.team.findUnique({
      where: { code: decoded.teamCode },
      select: { id: true },
    });
    if (!team) {
      throw new NotFoundException('Team not found for this code');
    }

    const progress = await this.prisma.riddleProgress.upsert({
      where: {
        teamId_riddleNumber: { teamId: team.id, riddleNumber: decoded.riddleNumber },
      },
      create: { teamId: team.id, riddleNumber: decoded.riddleNumber },
      update: {},
    });

    return {
      riddleNumber: decoded.riddleNumber,
      question: riddle.question,
      solved: progress.solved,
      attempts: progress.attempts,
    };
  }

  /**
   * Validates the submitted answer and records the attempt.
   * Once a riddle is solved, further submissions still return correct: true
   * but no longer increment attempts.
   */
  async submit(code: string, answer: string): Promise<RiddleSubmitResult> {
    const decoded = decodeRiddleCode(code);
    if (!decoded) {
      throw new BadRequestException('Invalid code');
    }

    const riddle = getRiddle(decoded.riddleNumber);
    if (!riddle) {
      throw new BadRequestException('Invalid code');
    }

    const team = await this.prisma.team.findUnique({
      where: { code: decoded.teamCode },
      select: { id: true },
    });
    if (!team) {
      throw new NotFoundException('Team not found for this code');
    }

    const existing = await this.prisma.riddleProgress.findUnique({
      where: {
        teamId_riddleNumber: { teamId: team.id, riddleNumber: decoded.riddleNumber },
      },
    });

    // Already solved earlier: don't count further attempts, just confirm.
    if (existing?.solved) {
      return { correct: true, solved: true, attempts: existing.attempts };
    }

    const correct = isCorrectAnswer(decoded.riddleNumber as 1 | 2 | 3, answer);

    const progress = await this.prisma.riddleProgress.upsert({
      where: {
        teamId_riddleNumber: { teamId: team.id, riddleNumber: decoded.riddleNumber },
      },
      create: {
        teamId: team.id,
        riddleNumber: decoded.riddleNumber,
        attempts: 1,
        solved: correct,
        solvedAt: correct ? new Date() : null,
      },
      update: {
        attempts: { increment: 1 },
        solved: correct ? true : undefined,
        solvedAt: correct ? new Date() : undefined,
      },
    });

    return { correct, solved: progress.solved, attempts: progress.attempts };
  }
}
