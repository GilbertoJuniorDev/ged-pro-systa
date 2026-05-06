import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Permission } from '@ged/database';
import type {
  IPermissionRepository,
  CreatePermissionData,
  UpdatePermissionData,
} from './interfaces/permission-repository.interface';

@Injectable()
export class PermissionsRepository implements IPermissionRepository {
  constructor(
    @InjectRepository(Permission)
    private readonly repo: Repository<Permission>,
  ) {}

  findAll(): Promise<Permission[]> {
    return this.repo.find({
      relations: { modulo: true } as Record<string, boolean>,
      order: { nome: 'ASC' },
    });
  }

  findById(id: string): Promise<Permission | null> {
    return this.repo.findOne({
      where: { id },
      relations: { modulo: true } as Record<string, boolean>,
    });
  }

  findByNome(nome: string): Promise<Permission | null> {
    return this.repo.findOne({ where: { nome } });
  }

  async create(data: CreatePermissionData): Promise<Permission> {
    const permission = this.repo.create(data);
    return this.repo.save(permission);
  }

  async update(id: string, data: UpdatePermissionData): Promise<Permission> {
    await this.repo.update(id, data);
    return this.repo.findOneOrFail({ where: { id } });
  }

  async remove(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
