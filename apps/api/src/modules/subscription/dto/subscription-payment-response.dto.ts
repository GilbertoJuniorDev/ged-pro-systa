import type { SubscriptionPayment } from '@ged/database';

export class SubscriptionPaymentResponseDto {
  readonly id!: string;
  readonly subscriptionId!: string;
  readonly paidAt!: string;
  readonly nextBillingDate!: string | null;
  readonly valor!: string;
  readonly notes!: string | null;
  readonly createdAt!: string;

  constructor(partial: SubscriptionPayment) {
    this.id = partial.id;
    this.subscriptionId = partial.subscriptionId;
    this.paidAt =
      partial.paidAt instanceof Date
        ? partial.paidAt.toISOString().slice(0, 10)
        : String(partial.paidAt);
    this.nextBillingDate =
      partial.nextBillingDate instanceof Date
        ? partial.nextBillingDate.toISOString().slice(0, 10)
        : partial.nextBillingDate
        ? String(partial.nextBillingDate)
        : null;
    this.valor = partial.valor;
    this.notes = partial.notes;
    this.createdAt = partial.createdAt.toISOString();
  }
}
