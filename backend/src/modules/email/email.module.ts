import { Module } from '@nestjs/common';
import {
  createEmailTransport,
  createFromAddress,
  EMAIL_FROM_ADDRESS,
  EMAIL_TRANSPORT,
  EmailService,
} from './service';

@Module({
  providers: [
    {
      provide: EMAIL_TRANSPORT,
      useFactory: createEmailTransport,
    },
    {
      provide: EMAIL_FROM_ADDRESS,
      useFactory: createFromAddress,
    },
    EmailService,
  ],
  exports: [EmailService],
})
export class EmailModule {}
