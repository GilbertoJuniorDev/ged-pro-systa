export class DossieResponseDto {
  readonly id!: string;
  readonly nome!: string;
  readonly descricao!: string | null;
  readonly isActive!: boolean;
  readonly departamentoId!: string;
  readonly createdAt!: Date;
  readonly updatedAt!: Date;

  constructor(partial: DossieResponseDto) {
    Object.assign(this, partial);
  }
}
