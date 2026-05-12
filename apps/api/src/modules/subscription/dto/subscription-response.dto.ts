import type { SubscriptionStatus } from '@ged/database';

export class SubscriptionResponseDto {
  readonly id!: string;
  readonly status!: SubscriptionStatus;
  readonly planName!: string | null;
  readonly valor!: string;
  readonly startDate!: string;
  readonly endDate!: string | null;
  readonly nextBillingDate!: string | null;
  readonly lastPaymentDate!: string | null;
  readonly notes!: string | null;
  readonly createdAt!: string;
  readonly updatedAt!: string;

  constructor(partial: {
    id: string;
    status: SubscriptionStatus;
    planName: string | null;
    valor: string;
    startDate: Date | string;
    endDate: Date | string | null;
    nextBillingDate: Date | string | null;
    lastPaymentDate: Date | string | null;
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    this.id = partial.id;
    this.status = partial.status;
    this.planName = partial.planName;
    this.valor = partial.valor;
    this.startDate = toIsoDateRequired(partial.startDate);
    this.endDate = toIsoDate(partial.endDate);
    this.nextBillingDate = toIsoDate(partial.nextBillingDate);
    this.lastPaymentDate = toIsoDate(partial.lastPaymentDate);
    this.notes = partial.notes;
    this.createdAt = partial.createdAt.toISOString();
    this.updatedAt = partial.updatedAt.toISOString();
  }
}

function toIsoDate(value: Date | string | null): string | null {
  if (value === null) return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return value;
}

function toIsoDateRequired(value: Date | string): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return value;
}
