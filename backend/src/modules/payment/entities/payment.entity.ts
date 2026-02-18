import { PaymentMethod } from '../domain/payment.types';

export class Payment {
  id!: string;
  amount!: number;
  date!: Date;
  confirmed!: boolean;
  proof!: Buffer;
  method!: PaymentMethod;
}
