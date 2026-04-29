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
}

