import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { UserDepartment } from '@ged/database';
import type { IUserDepartmentRepository } from './interfaces/user-department-repository.interface';

@Injectable()
export class UserDepartmentsRepository implements IUserDepartmentRepository {
  constructor(
    @InjectRepository(UserDepartment)
    private readonly repo: Repository<UserDepartment>,
  ) {}

  findByUserId(userId: string): Promise<UserDepartment[]> {
    return this.repo.find({
      where: { usuarioId: userId },
      relations: ['departamento'],
      order: { createdAt: 'ASC' },
    });
  }

  findByUserIds(userIds: string[]): Promise<UserDepartment[]> {
    if (userIds.length === 0) {
      return Promise.resolve([]);
    }
    return this.repo.find({
      where: { usuarioId: In(userIds) },
      relations: ['departamento'],
      order: { createdAt: 'ASC' },
    });
  }

  async createMany(usuarioId: string, departamentoIds: string[]): Promise<void> {
    if (departamentoIds.length === 0) {
      return;
    }
    const rows = departamentoIds.map((departamentoId) =>
      this.repo.create({ usuarioId, departamentoId }),
    );
    await this.repo.save(rows);
  }

  async removeMany(usuarioId: string, departamentoIds: string[]): Promise<void> {
    if (departamentoIds.length === 0) {
      return;
    }
    await this.repo.delete({ usuarioId, departamentoId: In(departamentoIds) });
  }
}
