import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';
export const Permissions = (...names: string[]) =>
  SetMetadata(PERMISSIONS_KEY, names);
