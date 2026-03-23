import { Admin, User } from '../../auth/entities';
import { Payment } from '../../payment/entities/payment.entity';

export class AdminService {
	reviewUnanswered(admin: Admin): void {
		void admin;
	}

	validatePayment(admin: Admin, payment: Payment): void {
		payment.validatedBy = admin;
	}

	banUser(admin: Admin, user: User): void {
		void admin;

		if ('banned' in user) {
			(user as User & { banned: boolean }).banned = true;
		}
	}
}
