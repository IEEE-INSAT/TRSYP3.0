import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { RoomingService } from './service';
import { RoomingController } from './controller';

/**
 * Rooming module handles room creation, invitations,
 * and room confirmation workflows.
 *
 * Exports RoomingService for use by other modules.
 */
@Module({
  imports: [PrismaModule],
  controllers: [RoomingController],
  providers: [RoomingService],
  exports: [RoomingService],
})
export class RoomingModule {}
