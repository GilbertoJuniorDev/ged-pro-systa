import type { AuthTokensResponse, JwtPayload } from '@ged/types';

export type { AuthTokensResponse, JwtPayload } from '@ged/types';

export interface LoginFormData {
  email: string;
  password: string;
}

export interface ApiError {
  message: string;
  statusCode: number;
  code: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  timestamp: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: JwtPayload['role'];
  accessToken: AuthTokensResponse['accessToken'];
  refreshToken: AuthTokensResponse['refreshToken'];
  expiresIn: AuthTokensResponse['expiresIn'];
}
