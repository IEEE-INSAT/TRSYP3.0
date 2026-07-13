import { Module } from '@nestjs/common';
import { EmailService } from './service';

@Module({
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
