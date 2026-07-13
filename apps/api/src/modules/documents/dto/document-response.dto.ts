import type { Confidencialidade, DocumentFase } from '@ged/database';

// Input shape for the DTO. Postgres `date` columns (validade, faseCorrenteDesde,
// faseIntermediarioDesde) arrive from TypeORM as 'YYYY-MM-DD' strings, but are Date objects
// when just set in memory; the derived vencimento* fields come in as Date from addMonths.
// Accept both and normalize to 'YYYY-MM-DD' in the constructor. `timestamp` columns
// (createdAt/updatedAt) stay as Date and serialize to full ISO — the correct shape for them.
interface DocumentResponseInput {
  id: string;
  nome: string;
  descricao: string | null;
  validade: Date | string | null;
  confidencialidade: Confidencialidade;
  departamentoId: string;
  serieId: string;
  dossieId: string | null;
  fase: DocumentFase;
  faseCorrenteDesde: Date | string;
  faseIntermediarioDesde: Date | string | null;
  arquivoNome: string;
  arquivoMimeType: string;
  arquivoTamanho: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  vencimentoCorrente: Date | string;
  vencimentoIntermediario: Date | string | null;
  elegivelTransferencia: boolean;
  destaque: boolean;
  exigeCadastro: boolean;
  acessoDepartamentoIds: string[];
  acessoUsuarioIds: string[];
}

export class DocumentResponseDto {
  readonly id!: string;
  readonly nome!: string;
  readonly descricao!: string | null;
  readonly validade!: string | null;
  readonly confidencialidade!: Confidencialidade;
  readonly departamentoId!: string;
  readonly serieId!: string;
  readonly dossieId!: string | null;
  readonly fase!: DocumentFase;
  readonly faseCorrenteDesde!: string;
  readonly faseIntermediarioDesde!: string | null;
  readonly arquivoNome!: string;
  readonly arquivoMimeType!: string;
  readonly arquivoTamanho!: number;
  readonly isActive!: boolean;
  readonly createdAt!: Date;
  readonly updatedAt!: Date;
  readonly vencimentoCorrente!: string;
  readonly vencimentoIntermediario!: string | null;
  readonly elegivelTransferencia!: boolean;
  readonly destaque!: boolean;
  readonly exigeCadastro!: boolean;
  readonly acessoDepartamentoIds!: string[];
  readonly acessoUsuarioIds!: string[];

  constructor(input: DocumentResponseInput) {
    this.id = input.id;
    this.nome = input.nome;
    this.descricao = input.descricao;
    this.validade = toIsoDate(input.validade);
    this.confidencialidade = input.confidencialidade;
    this.departamentoId = input.departamentoId;
    this.serieId = input.serieId;
    this.dossieId = input.dossieId;
    this.fase = input.fase;
    this.faseCorrenteDesde = toIsoDateRequired(input.faseCorrenteDesde);
    this.faseIntermediarioDesde = toIsoDate(input.faseIntermediarioDesde);
    this.arquivoNome = input.arquivoNome;
    this.arquivoMimeType = input.arquivoMimeType;
    this.arquivoTamanho = input.arquivoTamanho;
    this.isActive = input.isActive;
    this.createdAt = input.createdAt;
    this.updatedAt = input.updatedAt;
    this.vencimentoCorrente = toIsoDateRequired(input.vencimentoCorrente);
    this.vencimentoIntermediario = toIsoDate(input.vencimentoIntermediario);
    this.elegivelTransferencia = input.elegivelTransferencia;
    this.destaque = input.destaque;
    this.exigeCadastro = input.exigeCadastro;
    this.acessoDepartamentoIds = input.acessoDepartamentoIds;
    this.acessoUsuarioIds = input.acessoUsuarioIds;
  }
}

function toIsoDate(value: Date | string | null): string | null {
  if (value === null) return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return value;
}

function toIsoDateRequired(value: Date | string): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return value;
}
