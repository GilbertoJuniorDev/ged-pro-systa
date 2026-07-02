import { Inject, Injectable } from '@nestjs/common';
import { In, type EntityManager } from 'typeorm';
import { UserDepartment } from '@ged/database';
import type { IUserDepartmentRepository } from './interfaces/user-department-repository.interface';

export const USER_DEPARTMENT_REPOSITORY = 'USER_DEPARTMENT_REPOSITORY';

@Injectable()
export class UserDepartmentsService {
  constructor(
    @Inject(USER_DEPARTMENT_REPOSITORY)
    private readonly repository: IUserDepartmentRepository,
  ) {}

  findByUserId(userId: string): Promise<UserDepartment[]> {
    return this.repository.findByUserId(userId);
  }

  async findByUserIds(userIds: string[]): Promise<Map<string, UserDepartment[]>> {
    const rows = await this.repository.findByUserIds(userIds);
    const map = new Map<string, UserDepartment[]>();
    for (const row of rows) {
      const list = map.get(row.usuarioId) ?? [];
      list.push(row);
      map.set(row.usuarioId, list);
    }
    return map;
  }

  async syncForUser(
    userId: string,
    departmentIds: string[],
    manager?: EntityManager,
  ): Promise<void> {
    if (manager) {
      await this.syncWithManager(manager, userId, departmentIds);
      return;
    }

    const current = await this.repository.findByUserId(userId);
    const currentIds = current.map((row) => row.departamentoId);
    const toRemove = currentIds.filter((id) => !departmentIds.includes(id));
    const toAdd = departmentIds.filter((id) => !currentIds.includes(id));

    if (toRemove.length > 0) {
      await this.repository.removeMany(userId, toRemove);
    }
    if (toAdd.length > 0) {
      await this.repository.createMany(userId, toAdd);
    }
  }

  private async syncWithManager(
    manager: EntityManager,
    userId: string,
    departmentIds: string[],
  ): Promise<void> {
    const current = await manager.find(UserDepartment, { where: { usuarioId: userId } });
    const currentIds = current.map((row) => row.departamentoId);
    const toRemove = currentIds.filter((id) => !departmentIds.includes(id));
    const toAdd = departmentIds.filter((id) => !currentIds.includes(id));

    if (toRemove.length > 0) {
      await manager.delete(UserDepartment, { usuarioId: userId, departamentoId: In(toRemove) });
    }
    if (toAdd.length > 0) {
      const rows = toAdd.map((departamentoId) =>
        manager.create(UserDepartment, { usuarioId: userId, departamentoId }),
      );
      await manager.save(UserDepartment, rows);
    }
  }
}
