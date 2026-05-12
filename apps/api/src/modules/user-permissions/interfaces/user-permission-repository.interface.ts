import type { UserPermission } from '@ged/database';

export interface IUserPermissionRepository {
  findByUserId(userId: string): Promise<UserPermission[]>;
  findOne(userId: string, permissionId: string): Promise<UserPermission | null>;
  assign(userId: string, permissionId: string): Promise<UserPermission>;
  revoke(userId: string, permissionId: string): Promise<void>;
  hasPermission(userId: string, permissionName: string): Promise<boolean>;
}
