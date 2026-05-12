import type { Email, EmailType } from '@ged/database';

export class CompanyEmailResponseDto {
  readonly id!: string;
  readonly companyId!: string;
  readonly tipo!: EmailType;
  readonly endereco!: string;
  readonly createdAt!: string;
  readonly updatedAt!: string;

  constructor(e: Email) {
    this.id = e.id;
    this.companyId = e.companyId ?? '';
    this.tipo = e.tipo;
    this.endereco = e.endereco;
    this.createdAt = e.createdAt.toISOString();
    this.updatedAt = e.updatedAt.toISOString();
  }
}
