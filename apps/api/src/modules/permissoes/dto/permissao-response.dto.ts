export class PermissaoResponseDto {
  readonly id!: string;
  readonly nome!: string;
  readonly descricao!: string | null;
  readonly moduloId!: string | null;
  readonly modulo!: { id: string; nome: string; slug: string } | null;
  readonly createdAt!: Date;

  constructor(partial: PermissaoResponseDto) {
    Object.assign(this, partial);
  }
}
