import type { DocumentSeries, DestinacaoFinal } from '@ged/database';

export interface CreateDocumentSeriesData {
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

export interface UpdateDocumentSeriesData {
  readonly codigo?: string;
  readonly nome?: string;
  readonly descricao?: string | null;
  readonly prazoCorrenteMeses?: number;
  readonly prazoIntermediarioMeses?: number;
  readonly destinacaoFinal?: DestinacaoFinal;
  readonly baseLegal?: string | null;
  readonly isActive?: boolean;
  readonly seriePaiId?: string | null;
}

export interface IDocumentSeriesRepository {
  findAll(filter?: { departamentoId?: string }): Promise<DocumentSeries[]>;
  findById(id: string): Promise<DocumentSeries | null>;
  findByDepartamentoAndCodigo(
    departamentoId: string,
    codigo: string,
  ): Promise<DocumentSeries | null>;
  create(data: CreateDocumentSeriesData): Promise<DocumentSeries>;
  update(id: string, data: UpdateDocumentSeriesData): Promise<DocumentSeries>;
  delete(id: string): Promise<void>;
}
