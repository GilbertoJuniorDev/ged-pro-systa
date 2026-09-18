import type { ArquivoStatus } from '@ged/database';

export class ArquivoResponseDto {
  readonly id!: string;
  readonly codigo!: string;
  readonly ano!: number;
  readonly sequencia!: number;
  readonly nome!: string;
  readonly descricao!: string | null;
  readonly status!: ArquivoStatus;
  readonly dataEncerramento!: Date | null;
  readonly encerradoPorId!: string | null;
  readonly predio!: string | null;
  readonly sala!: string | null;
  readonly estante!: string | null;
  readonly prateleira!: string | null;
  readonly caixa!: string | null;
  readonly departamentoId!: string;
  readonly departamentoIds!: string[];
  readonly dossiesCount!: number;
  readonly createdAt!: Date;
  readonly updatedAt!: Date;

  constructor(partial: ArquivoResponseDto) {
    Object.assign(this, partial);
  }
}
