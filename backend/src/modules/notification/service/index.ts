import { Admin } from '../../auth/entities/admin.entity';
import { UnansweredQuestion } from '../../chatbot/entities/unanswered-question.entity';
import { Payment } from '../../payment/entities/payment.entity';
import { Participant } from '../../registration/entities/participant.entity';
import { Invitation } from '../../rooming/entities/invitation.entity';

export class NotificationService {
	notifyAdmin(admin: Admin, question: UnansweredQuestion): void {
		void admin;
		void question;
	}

	notifyRoomInvitation(guest: Participant, inv: Invitation): void {
		void guest;
		void inv;
	}

	notifyPaymentReview(p: Participant, payment: Payment): void {
		void p;
		void payment;
	}
}
