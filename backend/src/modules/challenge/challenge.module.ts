import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { ChallengeService } from './service';
import { ChallengeController } from './controller';

/**
 * Challenge module: the ArUco marker word game.
 * Every route requires a signed-in account; attempts are counted per
 * account (see ChallengeController).
 */
@Module({
  imports: [PrismaModule],
  controllers: [ChallengeController],
  providers: [ChallengeService],
})
export class ChallengeModule {}
