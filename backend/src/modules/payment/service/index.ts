import { randomUUID } from 'crypto';
import { Participant } from '../../registration/entities/participant.entity';
import { PaymentMethod } from '../domain/payment.types';
import { Payment } from '../entities/payment.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DomainEvents } from '../../../common/events/event-names';
import { PaymentProofSubmittedEvent, PaymentStatusUpdatedEvent } from '../events/payment.events';

export class PaymentService {
	constructor(private readonly eventEmitter: EventEmitter2) {}

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

	submitProof(payment: Payment, proof: Buffer, payer: Participant): void {
		payment.proof = proof;

		this.eventEmitter.emit(
			DomainEvents.PAYMENT_PROOF_SUBMITTED,
			new PaymentProofSubmittedEvent(
				payment.id,
				payer.id,
				`${payer.name} ${payer.lastName}`,
				payer.email,
				new Date(),
			),
		);
	}

	cancelPayment(payment: Payment): void {
		payment.confirmed = false;
	}

	confirm(payment: Payment, payer: Participant): void {
		payment.confirmed = true;

		this.eventEmitter.emit(
			DomainEvents.PAYMENT_STATUS_UPDATED,
			new PaymentStatusUpdatedEvent(
				payment.id,
				payer.id,
				payer.email,
				`${payer.name} ${payer.lastName}`,
				payment.amount,
				'Approved',
				'Your registration is confirmed. You will receive further details by email.',
			),
		);
	}

	reject(payment: Payment, payer: Participant): void {
		payment.confirmed = false;

		this.eventEmitter.emit(
			DomainEvents.PAYMENT_STATUS_UPDATED,
			new PaymentStatusUpdatedEvent(
				payment.id,
				payer.id,
				payer.email,
				`${payer.name} ${payer.lastName}`,
				payment.amount,
				'Rejected',
				'Please re-upload a valid proof of payment or contact support.',
			),
		);
	}
}
