import { Account } from './account.entity';
import { Position } from '../domain/auth.types';

export class Admin extends Account {
  position!: Position;
}
