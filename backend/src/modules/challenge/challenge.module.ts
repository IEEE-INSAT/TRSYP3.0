import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { ChallengeService } from './service';
import { ChallengeController } from './controller';

/**
 * Challenge module: the ArUco marker games, open while the admin portal has a
 * round live. Play is by Competition teams chosen for the round; tries and
 * word attempts are counted per team (see ChallengeController).
 */
@Module({
  imports: [PrismaModule],
  controllers: [ChallengeController],
  providers: [ChallengeService],
})
export class ChallengeModule {}
