import { Question } from './question.entity';
import { FAQResponse } from './faq-response.entity';

export class FAQ extends Question {
  // FAQ "1" -- "1..*" FAQResponse
  responses!: FAQResponse[];
}
