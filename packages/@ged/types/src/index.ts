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

export interface PermissionDto {
  readonly id: string;
  readonly nome: string;
  readonly descricao: string | null;
  readonly moduloId: string | null;
  readonly modulo: { readonly id: string; readonly nome: string; readonly slug: string } | null;
  readonly createdAt: string;
}

export interface ModuleDto {
  readonly id: string;
  readonly nome: string;
  readonly slug: string;
  readonly descricao: string | null;
  readonly icone: string | null;
  readonly ordem: number;
  readonly isActive: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface PhysicalPersonDto {
  readonly id: string;
  readonly userId: string;
  readonly nome: string;
  readonly sobrenome: string;
  readonly cpf: string;
  readonly dataNascimento: string;
  readonly sexo: 'M' | 'F' | 'O';
}

export interface AddressDto {
  readonly id: string;
  readonly pessoaFisicaId: string;
  readonly tipo: 'RESIDENCIAL' | 'COMERCIAL' | 'OUTRO';
  readonly logradouro: string;
  readonly numero: string;
  readonly complemento: string | null;
  readonly bairro: string;
  readonly cidade: string;
  readonly estado: string;
  readonly cep: string;
}

export interface PhoneDto {
  readonly id: string;
  readonly pessoaFisicaId: string;
  readonly tipo: 'CELULAR' | 'RESIDENCIAL' | 'COMERCIAL';
  readonly numero: string;
}

export interface AuditLogDto {
  readonly id: string;
  readonly usuarioId: string | null;
  readonly acao: string;
  readonly entidade: string | null;
  readonly entidadeId: string | null;
  readonly ipCliente: string | null;
  readonly userAgent: string | null;
  readonly createdAt: string;
}

export interface UserPermissionDto {
  readonly id: string;
  readonly usuarioId: string;
  readonly permissaoId: string;
  readonly permissaoNome: string;
  readonly permissaoDescricao: string | null;
  readonly createdAt: string;
}

export interface PaginatedResult<T> {
  readonly data: T[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
}

export interface MeResponseDto extends JwtPayload {
  readonly permissoes: string[];
  readonly modulos: string[];
}

