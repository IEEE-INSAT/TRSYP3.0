import { Account } from '../entities/account.entity';
import { Admin } from '../entities/admin.entity';

export class AuthService {
	login(email: string, pass: string): void {
		void email;
		void pass;
	}

	logout(account: Account): void {
		void account;
	}

	deleteAccount(account: Account): void {
		void account;
	}

	createAdmin(newAdmin: Admin): Admin {
		return newAdmin;
	}
}
