import { PaymentMethod } from '../domain/payment.types';
import { Admin } from '../../auth/entities/admin.entity';

export class Payment {
  id!: string;
  amount!: number;
  date!: Date;
  confirmed!: boolean;
  proof!: Buffer;
  method!: PaymentMethod;

  // Payment "0..*" -- "1" Admin : validatedBy
  validatedBy!: Admin;
}
