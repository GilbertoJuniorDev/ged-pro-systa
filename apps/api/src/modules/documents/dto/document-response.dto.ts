import type { Confidencialidade, DocumentFase } from '@ged/database';

export class DocumentResponseDto {
  readonly id!: string;
  readonly nome!: string;
  readonly descricao!: string | null;
  readonly validade!: Date | null;
  readonly confidencialidade!: Confidencialidade;
  readonly departamentoId!: string;
  readonly serieId!: string;
  readonly dossieId!: string | null;
  readonly fase!: DocumentFase;
  readonly faseCorrenteDesde!: Date;
  readonly faseIntermediarioDesde!: Date | null;
  readonly arquivoNome!: string;
  readonly arquivoMimeType!: string;
  readonly arquivoTamanho!: number;
  readonly isActive!: boolean;
  readonly createdAt!: Date;
  readonly updatedAt!: Date;
  readonly vencimentoCorrente!: Date;
  readonly vencimentoIntermediario!: Date | null;
  readonly elegivelTransferencia!: boolean;

  constructor(partial: DocumentResponseDto) {
    Object.assign(this, partial);
  }
}
