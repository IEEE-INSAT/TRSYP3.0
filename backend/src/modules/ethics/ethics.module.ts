import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { EthicsService } from './service';
import { EthicsController } from './controller';

/** The moderator-paced Ethical Decision Test. */
@Module({
  imports: [PrismaModule],
  controllers: [EthicsController],
  providers: [EthicsService],
})
export class EthicsModule {}
