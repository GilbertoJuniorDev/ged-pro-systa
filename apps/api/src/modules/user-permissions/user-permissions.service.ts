import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { UserPermission } from '@ged/database';
import type { IUserPermissionRepository } from './interfaces/user-permission-repository.interface';

export const USER_PERMISSIONS_REPOSITORY = 'USER_PERMISSIONS_REPOSITORY';

@Injectable()
export class UserPermissionsService {
  constructor(
    @Inject(USER_PERMISSIONS_REPOSITORY)
    private readonly repository: IUserPermissionRepository,
  ) {}

  findByUserId(userId: string): Promise<UserPermission[]> {
    return this.repository.findByUserId(userId);
  }

  async assign(userId: string, permissionId: string): Promise<UserPermission> {
    const existing = await this.repository.findOne(userId, permissionId);
    if (existing) {
      throw new ConflictException('User already has this permission');
    }
    return this.repository.assign(userId, permissionId);
  }

  async revoke(userId: string, permissionId: string): Promise<void> {
    const existing = await this.repository.findOne(userId, permissionId);
    if (!existing) {
      throw new NotFoundException('Permission assignment not found');
    }
    return this.repository.revoke(userId, permissionId);
  }

  hasPermission(userId: string, permissionName: string): Promise<boolean> {
    return this.repository.hasPermission(userId, permissionName);
  }
}
