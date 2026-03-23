import { Participant } from '../../registration/entities/participant.entity';
import { VisaStatus } from '../domain/visa.types';
import { VisaApplication } from '../entities/visa-application.entity';

export class VisaService {
	requestVisaLetter(participant: Participant): void {
		void participant;
	}

	submitApplication(app: VisaApplication): void {
		void app;
	}

	updateApplication(app: VisaApplication): void {
		void app;
	}

	approveApplication(app: VisaApplication): void {
		app.status = VisaStatus.APPROVED;
	}
}
