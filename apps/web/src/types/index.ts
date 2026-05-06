import type { AuthTokensResponse, JwtPayload } from '@ged/types';

export type {
  AuthTokensResponse,
  JwtPayload,
  UserDto,
  UpdateUserPayload,
  PermissionDto,
  ModuleDto,
  PhysicalPersonDto,
  AddressDto,
  PhoneDto,
  AuditLogDto,
  UserPermissionDto,
  PaginatedResult,
  MeResponseDto,
} from '@ged/types';

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
  permissoes: string[];
  modulos: string[];
}

// next-auth module augmentation — expõe campos customizados em session.user
declare module 'next-auth' {
  interface Session {
    user: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: string;
      accessToken?: string;
      refreshToken?: string;
      expiresIn?: number;
      permissoes?: string[];
      modulos?: string[];
    };
  }
}
