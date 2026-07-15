export const ROLE = {
  ADMIN: 'ADMIN',
  SUPER_ADMIN: 'SUPER_ADMIN',
  VIEWER: 'VIEWER',
} as const;

export type Role = (typeof ROLE)[keyof typeof ROLE];

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
  readonly departamentoIds: readonly string[];
}

export interface UpdateUserPayload {
  readonly name?: string;
  readonly role?: Extract<Role, 'ADMIN' | 'VIEWER'>;
  readonly departamentoIds?: readonly string[];
}

export interface PermissaoDto {
  readonly id: string;
  readonly nome: string;
  readonly descricao: string | null;
  readonly moduloId: string | null;
  readonly modulo: { readonly id: string; readonly nome: string; readonly slug: string } | null;
  readonly createdAt: string;
}

export type PermissionDto = PermissaoDto;

export interface ModuloDto {
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

export type ModuleDto = ModuloDto;

export interface DepartmentDto {
  readonly id: string;
  readonly nome: string;
  readonly descricao: string | null;
  readonly isActive: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface UpsertDepartmentInput {
  readonly nome: string;
  readonly descricao?: string | null;
  readonly isActive?: boolean;
}

export interface PessoaFisicaDto {
  readonly id: string;
  readonly userId: string;
  readonly nome: string;
  readonly sobrenome: string;
  readonly cpf: string;
  readonly dataNascimento: string;
  readonly sexo: 'M' | 'F' | 'O';
}

export type PhysicalPersonDto = PessoaFisicaDto;

export interface EnderecoDto {
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

export type AddressDto = EnderecoDto;

export interface TelefoneDto {
  readonly id: string;
  readonly pessoaFisicaId: string;
  readonly tipo: 'CELULAR' | 'RESIDENCIAL' | 'COMERCIAL';
  readonly numero: string;
}

export type PhoneDto = TelefoneDto;

export interface AuditLogDto {
  readonly id: string;
  readonly usuarioId: string | null;
  readonly acao: string;
  readonly entidade: string | null;
  readonly entidadeId: string | null;
  readonly ipCliente: string | null;
  readonly userAgent: string | null;
  readonly dadosAnteriores: Record<string, unknown> | null;
  readonly dadosNovos: Record<string, unknown> | null;
  readonly createdAt: string;
}

export interface UsuarioPermissaoDto {
  readonly id: string;
  readonly usuarioId: string;
  readonly permissaoId: string;
  readonly permissaoNome: string;
  readonly permissaoDescricao: string | null;
  readonly createdAt: string;
}

export type UserPermissionDto = UsuarioPermissaoDto;

export interface PaginatedResult<T> {
  readonly data: T[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
}

export interface MeResponseDto extends JwtPayload {
  readonly permissoes: string[];
  readonly modulos: string[];
  readonly departamentos: ReadonlyArray<Pick<DepartmentDto, 'id' | 'nome'>>;
}

// ── Company (Pessoa Jurídica) — singleton ─────────────────────────────

export interface CompanyDto {
  readonly id: string;
  readonly cnpj: string;
  readonly razaoSocial: string;
  readonly nomeFantasia: string | null;
  readonly nomeEmpresarial: string | null;
  readonly inscricaoEstadual: string | null;
  readonly matriz: boolean;
  readonly dataAbertura: string | null;
  readonly porte: string | null;
  readonly naturezaJuridicaCodigo: string | null;
  readonly naturezaJuridicaDescricao: string | null;
  readonly situacaoCadastral: string | null;
  readonly situacaoCadastralData: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface UpsertCompanyInput {
  readonly cnpj: string;
  readonly razaoSocial: string;
  readonly nomeFantasia?: string | null;
  readonly nomeEmpresarial?: string | null;
  readonly inscricaoEstadual?: string | null;
  readonly matriz?: boolean;
  readonly dataAbertura?: string | null;
  readonly porte?: string | null;
  readonly naturezaJuridicaCodigo?: string | null;
  readonly naturezaJuridicaDescricao?: string | null;
  readonly situacaoCadastral?: string | null;
  readonly situacaoCadastralData?: string | null;
}

// ── Company sub-recursos: Address / Phone / Email / CNAE ──────────────

export type CompanyAddressType = 'RESIDENCIAL' | 'COMERCIAL' | 'OUTRO';

export interface CompanyAddressDto {
  readonly id: string;
  readonly companyId: string;
  readonly tipo: CompanyAddressType;
  readonly logradouro: string;
  readonly numero: string;
  readonly complemento: string | null;
  readonly bairro: string;
  readonly cidade: string;
  readonly estado: string;
  readonly cep: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface UpsertCompanyAddressInput {
  readonly tipo: CompanyAddressType;
  readonly logradouro: string;
  readonly numero: string;
  readonly complemento?: string | null;
  readonly bairro: string;
  readonly cidade: string;
  readonly estado: string;
  readonly cep: string;
}

export type CompanyPhoneType = 'CELULAR' | 'RESIDENCIAL' | 'COMERCIAL';

export interface CompanyPhoneDto {
  readonly id: string;
  readonly companyId: string;
  readonly tipo: CompanyPhoneType;
  readonly numero: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface UpsertCompanyPhoneInput {
  readonly tipo: CompanyPhoneType;
  readonly numero: string;
}

export type CompanyEmailType = 'PRINCIPAL' | 'FINANCEIRO' | 'COMERCIAL' | 'OUTRO';

export interface CompanyEmailDto {
  readonly id: string;
  readonly companyId: string;
  readonly tipo: CompanyEmailType;
  readonly endereco: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface UpsertCompanyEmailInput {
  readonly tipo: CompanyEmailType;
  readonly endereco: string;
}

export interface CompanyCnaeDto {
  readonly id: string;
  readonly companyId: string;
  readonly codigo: string;
  readonly descricao: string;
  readonly principal: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface UpsertCompanyCnaeInput {
  readonly codigo: string;
  readonly descricao: string;
  readonly principal?: boolean;
}

// ── Subscription — singleton ──────────────────────────────────────────

export const SUBSCRIPTION_STATUS = {
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
  CANCELLED: 'CANCELLED',
  OVERDUE: 'OVERDUE',
  TRIAL: 'TRIAL',
} as const;

export type SubscriptionStatus =
  (typeof SUBSCRIPTION_STATUS)[keyof typeof SUBSCRIPTION_STATUS];

export interface SubscriptionDto {
  readonly id: string;
  readonly status: SubscriptionStatus;
  readonly planName: string | null;
  readonly valor: string;
  readonly startDate: string;
  readonly endDate: string | null;
  readonly nextBillingDate: string | null;
  readonly lastPaymentDate: string | null;
  readonly notes: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface UpsertSubscriptionInput {
  readonly status?: SubscriptionStatus;
  readonly planName?: string | null;
  readonly valor: string;
  readonly startDate: string;
  readonly endDate?: string | null;
  readonly nextBillingDate?: string | null;
  readonly notes?: string | null;
}

export interface RecordPaymentInput {
  readonly paidAt: string;
  readonly nextBillingDate?: string | null;
}

export interface SubscriptionPaymentDto {
  readonly id: string;
  readonly subscriptionId: string;
  readonly paidAt: string;
  readonly nextBillingDate: string | null;
  readonly valor: string;
  readonly notes: string | null;
  readonly createdAt: string;
}

// ── GED — Document Series (Classificação/Temporalidade) ────────────────

export const DESTINACAO_FINAL = {
  GUARDA_PERMANENTE: 'GUARDA_PERMANENTE',
  ELIMINACAO: 'ELIMINACAO',
} as const;

export type DestinacaoFinal = (typeof DESTINACAO_FINAL)[keyof typeof DESTINACAO_FINAL];

export interface DocumentSeriesDto {
  readonly id: string;
  readonly codigo: string;
  readonly nome: string;
  readonly descricao: string | null;
  readonly prazoCorrenteMeses: number;
  readonly prazoIntermediarioMeses: number;
  readonly destinacaoFinal: DestinacaoFinal;
  readonly baseLegal: string | null;
  readonly isActive: boolean;
  readonly departamentoId: string;
  readonly seriePaiId: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface UpsertDocumentSeriesInput {
  readonly codigo: string;
  readonly nome: string;
  readonly descricao?: string | null;
  readonly prazoCorrenteMeses: number;
  readonly prazoIntermediarioMeses: number;
  readonly destinacaoFinal: DestinacaoFinal;
  readonly baseLegal?: string | null;
  readonly isActive?: boolean;
  readonly departamentoId: string;
  readonly seriePaiId?: string | null;
}

// ── GED — Dossiê ────────────────────────────────────────────────────────

export interface DossieDto {
  readonly id: string;
  readonly nome: string;
  readonly descricao: string | null;
  readonly isActive: boolean;
  readonly departamentoId: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface UpsertDossieInput {
  readonly nome: string;
  readonly descricao?: string | null;
  readonly isActive?: boolean;
  readonly departamentoId: string;
}

// ── GED — Document ──────────────────────────────────────────────────────

export const CONFIDENCIALIDADE = {
  PUBLICO: 'PUBLICO',
  RESTRITO: 'RESTRITO',
  CONFIDENCIAL: 'CONFIDENCIAL',
} as const;

export type Confidencialidade = (typeof CONFIDENCIALIDADE)[keyof typeof CONFIDENCIALIDADE];

export const DOCUMENT_FASE = {
  CORRENTE: 'CORRENTE',
  INTERMEDIARIO: 'INTERMEDIARIO',
} as const;

export type DocumentFase = (typeof DOCUMENT_FASE)[keyof typeof DOCUMENT_FASE];

export interface DocumentDto {
  readonly id: string;
  readonly nome: string;
  readonly descricao: string | null;
  readonly validade: string | null;
  readonly confidencialidade: Confidencialidade;
  readonly departamentoId: string;
  readonly serieId: string;
  readonly dossieId: string | null;
  readonly fase: DocumentFase;
  readonly faseCorrenteDesde: string;
  readonly faseIntermediarioDesde: string | null;
  readonly arquivoNome: string;
  readonly arquivoMimeType: string;
  readonly arquivoTamanho: number;
  readonly isActive: boolean;
  readonly vencimentoCorrente: string;
  readonly vencimentoIntermediario: string | null;
  readonly elegivelTransferencia: boolean;
  readonly destaque: boolean;
  readonly exigeCadastro: boolean;
  readonly acessoDepartamentoIds: string[];
  readonly acessoUsuarioIds: string[];
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface UploadDocumentInput {
  readonly nome: string;
  readonly descricao?: string | null;
  readonly validade?: string | null;
  readonly confidencialidade: Confidencialidade;
  readonly departamentoId: string;
  readonly serieId: string;
  readonly dossieId?: string | null;
  readonly destaque?: boolean;
  readonly exigeCadastro?: boolean;
  readonly accessDepartamentoIds?: string[];
  readonly accessUserIds?: string[];
}

export interface UpdateDocumentInput {
  readonly nome?: string;
  readonly descricao?: string | null;
  readonly validade?: string | null;
  readonly confidencialidade?: Confidencialidade;
  readonly serieId?: string;
  readonly dossieId?: string | null;
  readonly isActive?: boolean;
  readonly destaque?: boolean;
  readonly exigeCadastro?: boolean;
  readonly accessDepartamentoIds?: string[];
  readonly accessUserIds?: string[];
}

export interface DocumentQuery {
  readonly departamentoId?: string;
  readonly dossieId?: string;
  readonly serieId?: string;
  readonly fase?: DocumentFase;
  readonly confidencialidade?: Confidencialidade;
  readonly page?: number;
  readonly limit?: number;
}

// ── GED — Public Document Portal ──────────────────────────────────────

export const TIPO_DOCUMENTO = {
  CPF: 'CPF',
  CNPJ: 'CNPJ',
} as const;

export type TipoDocumento = (typeof TIPO_DOCUMENTO)[keyof typeof TIPO_DOCUMENTO];

export interface PublicDocumentDto {
  readonly id: string;
  readonly nome: string;
  readonly descricao: string | null;
  readonly arquivoNome: string;
  readonly arquivoMimeType: string;
  readonly arquivoTamanho: number;
  readonly serie: { readonly id: string; readonly codigo: string; readonly nome: string };
  readonly destaque: boolean;
  readonly exigeCadastro: boolean;
  readonly createdAt: string;
}

export interface RegisterAccessInput {
  readonly email: string;
  readonly nome: string;
  readonly documento: string;
  readonly tipoDocumento: TipoDocumento;
}

export interface RegisterAccessResult {
  readonly downloadToken: string;
}

export type PaginatedPublicDocuments = PaginatedResult<PublicDocumentDto>;

