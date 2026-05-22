import type { AuthTokensResponse, JwtPayload } from '@ged/types';

export type {
  AuthTokensResponse,
  JwtPayload,
  UserDto,
  UpdateUserPayload,
  PermissaoDto,
  PermissionDto,
  ModuloDto,
  ModuleDto,
  PessoaFisicaDto,
  PhysicalPersonDto,
  EnderecoDto,
  AddressDto,
  TelefoneDto,
  PhoneDto,
  AuditLogDto,
  UsuarioPermissaoDto,
  UserPermissionDto,
  PaginatedResult,
  MeResponseDto,
  CompanyDto,
  UpsertCompanyInput,
  CompanyAddressDto,
  UpsertCompanyAddressInput,
  CompanyAddressType,
  CompanyPhoneDto,
  UpsertCompanyPhoneInput,
  CompanyPhoneType,
  CompanyEmailDto,
  UpsertCompanyEmailInput,
  CompanyEmailType,
  CompanyCnaeDto,
  UpsertCompanyCnaeInput,
  SubscriptionDto,
  UpsertSubscriptionInput,
  RecordPaymentInput,
  SubscriptionStatus,
  SubscriptionPaymentDto,
} from '@ged/types';
export { SUBSCRIPTION_STATUS } from '@ged/types';

export interface SystemVersionDto {
  readonly appName: string;
  readonly version: string;
  readonly environment: string;
  readonly buildDate: string;
}

export interface DependencyInfo {
  readonly name: string;
  readonly version: string;
  readonly license: string;
}

export interface AdminSystemVersionDto extends SystemVersionDto {
  readonly nodeVersion: string;
  readonly dbVersion: string;
  readonly dbStatus: 'online' | 'offline';
  readonly redisStatus: 'online' | 'offline';
  readonly dependencies: readonly DependencyInfo[];
}

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
