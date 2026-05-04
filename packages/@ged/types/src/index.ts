import type { Role } from '@ged/database';

export { ROLE, type Role } from '@ged/database';

export interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
}

export interface AuthTokensResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

export interface UserDto {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly role: Role;
  readonly isActive: boolean;
  readonly createdAt: string;
}

export interface UpdateUserPayload {
  readonly name?: string;
  readonly role?: Extract<Role, 'MANAGER' | 'VIEWER'>;
}

