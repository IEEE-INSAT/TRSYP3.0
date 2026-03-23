import { UnansweredQuestion } from '../../chatbot/entities/unanswered-question.entity';
import { Payment } from '../../payment/entities/payment.entity';
import { Participant } from '../../registration/entities/participant.entity';
import { Invitation } from '../../rooming/entities/invitation.entity';

export class EmailService {
	sendPaymentResult(p: Participant, payment: Payment): void {
		this.logDelivery(p.email, `payment:${payment.id}`);
	}

	sendAdminResponse(p: Participant, q: UnansweredQuestion): void {
		this.logDelivery(p.email, `admin-response:${q.id}`);
	}

	sendRoomInvitation(p: Participant, inv: Invitation): void {
		this.logDelivery(p.email, `room-invitation:${inv.id}`);
	}

	logDelivery(recipient: string, type: string): void {
		void recipient;
		void type;
	}
}
