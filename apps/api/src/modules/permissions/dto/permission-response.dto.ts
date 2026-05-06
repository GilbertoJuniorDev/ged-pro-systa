export class PermissionResponseDto {
  readonly id!: string;
  readonly nome!: string;
  readonly descricao!: string | null;
  readonly moduloId!: string | null;
  readonly modulo!: { id: string; nome: string; slug: string } | null;
  readonly createdAt!: Date;

  constructor(partial: PermissionResponseDto) {
    Object.assign(this, partial);
  }
}
