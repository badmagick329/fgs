import { IPasswordHasher } from '@/features/admin/domain/interfaces';
import bcrypt from 'bcryptjs';
import 'server-only';

export class PasswordHasher implements IPasswordHasher {
  constructor(private readonly passwordSaltRounds: number) {}

  hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.passwordSaltRounds);
  }

  verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}
