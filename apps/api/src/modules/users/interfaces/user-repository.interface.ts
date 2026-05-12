import type { User } from '@ged/database';

export interface CreateUserData {
  name: string;
  email: string;
  passwordHash: string;
  role?: User['role'];
}

export interface UpdateUserData {
  name?: string;
  role?: User['role'];
}

export interface IUserRepository {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  findAll(): Promise<User[]>;
  create(data: CreateUserData): Promise<User>;
  updatePassword(id: string, passwordHash: string): Promise<void>;
  update(id: string, data: UpdateUserData): Promise<User>;
  remove(id: string): Promise<void>;
  setActive(id: string, isActive: boolean): Promise<User>;
}
