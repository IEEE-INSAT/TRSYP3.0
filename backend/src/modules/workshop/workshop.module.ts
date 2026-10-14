import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { WorkshopService } from './service';
import { WorkshopController } from './controller';

/**
 * Workshop module: day-3 workshop seats, booked by paid participants from the
 * dashboard.
 */
@Module({
  imports: [PrismaModule],
  controllers: [WorkshopController],
  providers: [WorkshopService],
  exports: [WorkshopService],
})
export class WorkshopModule {}
