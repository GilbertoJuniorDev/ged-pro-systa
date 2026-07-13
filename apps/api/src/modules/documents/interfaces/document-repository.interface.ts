import type { Confidencialidade, Document, DocumentFase } from '@ged/database';

// Declared here (a leaf module) rather than in documents.service.ts to avoid a circular
// require: upload-document.use-case.ts needs this token but documents.service.ts also
// needs a real (non-type-only) import of UploadDocumentUseCase for constructor DI, which
// would create a cycle if this constant lived in documents.service.ts. documents.service.ts
// re-exports this so `import { DOCUMENT_REPOSITORY } from './documents.service'` still works.
export const DOCUMENT_REPOSITORY = 'DOCUMENT_REPOSITORY';

export interface CreateDocumentData {
  readonly nome: string;
  readonly descricao?: string | null;
  readonly validade?: Date | null;
  readonly confidencialidade: Confidencialidade;
  readonly departamentoId: string;
  readonly serieId: string;
  readonly dossieId?: string | null;
  readonly fase: DocumentFase;
  readonly faseCorrenteDesde: Date;
  readonly arquivoNome: string;
  readonly arquivoChave: string;
  readonly arquivoMimeType: string;
  readonly arquivoTamanho: number;
  readonly destaque?: boolean;
  readonly exigeCadastro?: boolean;
}

export interface UpdateDocumentData {
  readonly nome?: string;
  readonly descricao?: string | null;
  readonly validade?: Date | null;
  readonly confidencialidade?: Confidencialidade;
  readonly serieId?: string;
  readonly dossieId?: string | null;
  readonly isActive?: boolean;
  readonly fase?: DocumentFase;
  readonly faseIntermediarioDesde?: Date;
  readonly destaque?: boolean;
  readonly exigeCadastro?: boolean;
}

export interface DocumentQueryFilter {
  readonly departamentoId?: string;
  readonly dossieId?: string;
  readonly serieId?: string;
  readonly fase?: DocumentFase;
  readonly confidencialidade?: Confidencialidade;
  readonly page?: number;
  readonly limit?: number;
  // Quando definido, a listagem é restrita ao que o usuário não-privilegiado pode ver
  // (ver DocumentsService.assertCanAccess para a mesma regra aplicada a um único documento).
  // `null` (papel privilegiado) = sem restrição alguma.
  readonly accessScope?: {
    readonly userId: string;
    readonly userDepartamentoIds: readonly string[];
  } | null;
}

export interface PaginatedDocuments {
  readonly data: Document[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
}

export interface IDocumentRepository {
  findAll(filter: DocumentQueryFilter): Promise<PaginatedDocuments>;
  findById(id: string): Promise<Document | null>;
  create(data: CreateDocumentData): Promise<Document>;
  update(id: string, data: UpdateDocumentData): Promise<Document>;
  delete(id: string): Promise<void>;
}
