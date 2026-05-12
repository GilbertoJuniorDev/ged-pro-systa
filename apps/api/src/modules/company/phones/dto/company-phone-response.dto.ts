import type { Phone, PhoneType } from '@ged/database';

export class CompanyPhoneResponseDto {
  readonly id!: string;
  readonly companyId!: string;
  readonly tipo!: PhoneType;
  readonly numero!: string;
  readonly createdAt!: string;
  readonly updatedAt!: string;

  constructor(p: Phone) {
    this.id = p.id;
    this.companyId = p.companyId ?? '';
    this.tipo = p.tipo;
    this.numero = p.numero;
    this.createdAt = p.createdAt.toISOString();
    this.updatedAt = p.updatedAt.toISOString();
  }
}
