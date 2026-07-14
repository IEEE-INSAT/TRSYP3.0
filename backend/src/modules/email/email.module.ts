import { Module } from '@nestjs/common';
import { createEmailTransport, EMAIL_TRANSPORT, EmailService } from './service';

@Module({
  providers: [
    {
      provide: EMAIL_TRANSPORT,
      useFactory: createEmailTransport,
    },
    EmailService,
  ],
  exports: [EmailService],
})
export class EmailModule {}
