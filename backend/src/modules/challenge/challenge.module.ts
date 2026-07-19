import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { ChallengeService } from './service';
import { ChallengeController } from './controller';

/**
 * Challenge module: the riddle mini-game.
 * Public — teams authenticate implicitly via the code they were handed,
 * not via a logged-in session, so this module doesn't depend on Auth.
 */
@Module({
  imports: [PrismaModule],
  controllers: [ChallengeController],
  providers: [ChallengeService],
})
export class ChallengeModule {}
