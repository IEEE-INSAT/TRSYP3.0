import { Question } from './question.entity';
import { User } from '../../auth/entities/user.entity';

export class UnansweredQuestion extends Question {
  resolved!: boolean;
  source!: string;
  responder!: string;

  // User "1" -- "0..*" UnansweredQuestion
  user!: User;

  markResolved(): void {}
}
