export abstract class Account {
  id!: string;
  email!: string;
  password!: string;
  name!: string;
  lastName!: string;

  login(): void {}
  logout(): void {}
}
