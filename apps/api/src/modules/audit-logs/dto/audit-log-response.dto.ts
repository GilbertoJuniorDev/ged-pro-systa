export class AuditLogResponseDto {
  readonly id!: string;
  readonly usuarioId!: string | null;
  readonly acao!: string;
  readonly entidade!: string | null;
  readonly entidadeId!: string | null;
  readonly ipCliente!: string | null;
  readonly userAgent!: string | null;
  readonly dadosAnteriores!: Record<string, unknown> | null;
  readonly dadosNovos!: Record<string, unknown> | null;
  readonly createdAt!: Date;

  constructor(partial: AuditLogResponseDto) {
    Object.assign(this, partial);
  }
}

export class PaginatedAuditLogResponseDto {
  readonly data!: AuditLogResponseDto[];
  readonly total!: number;
  readonly page!: number;
  readonly limit!: number;

  constructor(partial: PaginatedAuditLogResponseDto) {
    Object.assign(this, partial);
  }
}
