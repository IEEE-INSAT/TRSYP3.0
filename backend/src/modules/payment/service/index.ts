import { randomUUID } from 'crypto';
import { Participant } from '../../registration/entities/participant.entity';
import { PaymentMethod } from '../domain/payment.types';
import { Payment } from '../entities/payment.entity';

export class PaymentService {
	createPayment(payer: Participant, amount: number): Payment {
		const payment = new Payment();
		payment.id = randomUUID();
		payment.amount = amount;
		payment.date = new Date();
		payment.confirmed = false;
		payment.proof = Buffer.alloc(0);
		payment.method = PaymentMethod.IN_PERSON;
		payer.payment = payment;
		payer.paid = false;
		return payment;
	}

	submitProof(payment: Payment, proof: Buffer): void {
		payment.proof = proof;
	}

	cancelPayment(payment: Payment): void {
		payment.confirmed = false;
	}

	confirm(payment: Payment): void {
		payment.confirmed = true;
	}
}
