import type { Cnae } from '@ged/database';

export class CompanyCnaeResponseDto {
  readonly id!: string;
  readonly companyId!: string;
  readonly codigo!: string;
  readonly descricao!: string;
  readonly principal!: boolean;
  readonly createdAt!: string;
  readonly updatedAt!: string;

  constructor(c: Cnae) {
    this.id = c.id;
    this.companyId = c.companyId;
    this.codigo = c.codigo;
    this.descricao = c.descricao;
    this.principal = c.principal;
    this.createdAt = c.createdAt.toISOString();
    this.updatedAt = c.updatedAt.toISOString();
  }
}
