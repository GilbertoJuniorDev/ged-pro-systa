import type { DestinacaoFinal } from '@ged/database';

export class DocumentSeriesResponseDto {
  readonly id!: string;
  readonly codigo!: string;
  readonly nome!: string;
  readonly descricao!: string | null;
  readonly prazoCorrenteMeses!: number;
  readonly prazoIntermediarioMeses!: number;
  readonly destinacaoFinal!: DestinacaoFinal;
  readonly baseLegal!: string | null;
  readonly isActive!: boolean;
  readonly departamentoId!: string;
  readonly seriePaiId!: string | null;
  readonly createdAt!: Date;
  readonly updatedAt!: Date;

  constructor(partial: DocumentSeriesResponseDto) {
    Object.assign(this, partial);
  }
}
