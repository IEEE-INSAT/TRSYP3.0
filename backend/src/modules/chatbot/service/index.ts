import { User } from '../../auth/entities/user.entity';
// import { NotificationService } from '../../notification/service';
import { FAQ, FAQResponse, UnansweredQuestion } from '../entities';

export class ChatService {
	constructor(/* private readonly notificationService: NotificationService */) {}

	postQuestion(user: User, content: string): void {
		const unanswered = new UnansweredQuestion();
		unanswered.user = user;
		unanswered.content = content;
		unanswered.timestamp = new Date();
		unanswered.resolved = false;
		unanswered.source = 'chat';
		unanswered.responder = '';
	}

	processMessage(user: User, content: string): string {
		const faq = this.searchInFAQ(content);

		if (!faq) {
			const unanswered = new UnansweredQuestion();
			unanswered.user = user;
			unanswered.content = content;
			unanswered.timestamp = new Date();
			unanswered.resolved = false;
			unanswered.source = 'chat';
			unanswered.responder = '';
			// void this.notificationService;
			return 'Your question has been sent to admin review.';
		}

		const response = this.selectRandomResponse(faq.id);
		return response?.responseText ?? 'No answer available.';
	}

	markResolved(q: UnansweredQuestion): void {
		q.markResolved();
	}

	private searchInFAQ(content: string): FAQ | undefined {
		void content;
		return undefined;
	}

	private selectRandomResponse(faqId: string): FAQResponse | undefined {
		void faqId;
		return undefined;
	}
}
