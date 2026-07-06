import type { UserDepartment } from '@ged/database';

export interface IUserDepartmentRepository {
  findByUserId(userId: string): Promise<UserDepartment[]>;
  findByUserIds(userIds: string[]): Promise<UserDepartment[]>;
  createMany(usuarioId: string, departamentoIds: string[]): Promise<void>;
  removeMany(usuarioId: string, departamentoIds: string[]): Promise<void>;
}
