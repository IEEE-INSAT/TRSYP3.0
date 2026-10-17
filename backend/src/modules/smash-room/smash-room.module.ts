import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { SmashRoomService } from './service';
import { SmashRoomController } from './controller';

/** Smash Room: one final form per participant. */
@Module({
  imports: [PrismaModule],
  controllers: [SmashRoomController],
  providers: [SmashRoomService],
})
export class SmashRoomModule {}
