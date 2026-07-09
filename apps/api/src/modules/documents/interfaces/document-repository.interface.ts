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
}

export interface DocumentQueryFilter {
  readonly departamentoId?: string;
  readonly dossieId?: string;
  readonly serieId?: string;
  readonly fase?: DocumentFase;
  readonly confidencialidade?: Confidencialidade;
  readonly page?: number;
  readonly limit?: number;
  // Departamentos aos quais o usuário tem acesso. Quando definido e não-vazio, restringe
  // a listagem a documentos desses departamentos (escopo por usuário não-privilegiado).
  readonly allowedDepartamentoIds?: readonly string[];
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
