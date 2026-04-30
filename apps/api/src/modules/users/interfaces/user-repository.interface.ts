import type { User } from '@ged/database';

export interface CreateUserData {
  name: string;
  email: string;
  passwordHash: string;
  role?: User['role'];
}

export interface IUserRepository {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  create(data: CreateUserData): Promise<User>;
  updatePassword(id: string, passwordHash: string): Promise<void>;
}
