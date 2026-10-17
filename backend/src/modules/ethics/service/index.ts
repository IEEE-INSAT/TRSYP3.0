import { Injectable, ForbiddenException, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'node:crypto';
import { PrismaService } from '../../../prisma/prisma.service';
import { SetEthicsStateInput } from '../dto';

export type EthicsState = { step: number; votingOpen: boolean; updatedAt: Date };

/**
 * How long a read of the state is reused. Every participant's page asks for
 * it every few seconds; this keeps that to about one database read a second
 * however many are watching. A moderator's change clears it at once.
 */
const CACHE_MS = 1000;

/**
 * The live Ethical Decision Test. Moderators move every participant's screen
 * from scenario to scenario and open or close voting; the scenarios
 * themselves live in the frontend. Votes are never sent here.
 */
@Injectable()
export class EthicsService {
  private cache: { state: EthicsState; at: number } | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async getState(): Promise<EthicsState> {
    if (this.cache && Date.now() - this.cache.at < CACHE_MS) return this.cache.state;

    const row = await this.prisma.ethicsSession.upsert({ where: { id: 1 }, create: {}, update: {} });
    const state = { step: row.step, votingOpen: row.votingOpen, updatedAt: row.updatedAt };
    this.cache = { state, at: Date.now() };
    return state;
  }

  /**
   * @throws ServiceUnavailableException no `ETHICS_MODERATOR_KEY` is set
   * @throws ForbiddenException          wrong key
   */
  async setState(key: string | undefined, input: SetEthicsStateInput): Promise<EthicsState> {
    this.assertModerator(key);

    const row = await this.prisma.ethicsSession.upsert({
      where: { id: 1 },
      create: input,
      update: input,
    });
    const state = { step: row.step, votingOpen: row.votingOpen, updatedAt: row.updatedAt };
    this.cache = { state, at: Date.now() };
    return state;
  }

  /** Checks the key without letting response times hint at how much of it matched. */
  assertModerator(key: string | undefined): void {
    const expected = this.config.get<string>('ETHICS_MODERATOR_KEY')?.trim();
    if (!expected) throw new ServiceUnavailableException('The moderator key is not set up on the server.');

    const given = Buffer.from(key?.trim() ?? '');
    const wanted = Buffer.from(expected);
    if (given.length !== wanted.length || !timingSafeEqual(given, wanted)) {
      throw new ForbiddenException('Wrong moderator key.');
    }
  }
}
