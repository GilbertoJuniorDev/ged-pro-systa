import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Permission } from '@ged/database';
import type {
  IPermissionRepository,
  CreatePermissionData,
  UpdatePermissionData,
} from './interfaces/permission-repository.interface';

export const PERMISSION_REPOSITORY = 'PERMISSION_REPOSITORY';

@Injectable()
export class PermissionsService {
  constructor(
    @Inject(PERMISSION_REPOSITORY)
    private readonly permissionRepository: IPermissionRepository,
  ) {}

  findAll(): Promise<Permission[]> {
    return this.permissionRepository.findAll();
  }

  async findById(id: string): Promise<Permission> {
    const permission = await this.permissionRepository.findById(id);
    if (!permission) throw new NotFoundException('Permission not found');
    return permission;
  }

  async create(data: CreatePermissionData): Promise<Permission> {
    const existing = await this.permissionRepository.findByNome(data.nome);
    if (existing) throw new ConflictException('A permission with this name already exists');
    return this.permissionRepository.create(data);
  }

  async update(id: string, data: UpdatePermissionData): Promise<Permission> {
    await this.findById(id);

    if (data.nome) {
      const existing = await this.permissionRepository.findByNome(data.nome);
      if (existing && existing.id !== id) {
        throw new ConflictException('A permission with this name already exists');
      }
    }

    return this.permissionRepository.update(id, data);
  }

  async remove(id: string): Promise<void> {
    await this.findById(id);
    return this.permissionRepository.remove(id);
  }
}
