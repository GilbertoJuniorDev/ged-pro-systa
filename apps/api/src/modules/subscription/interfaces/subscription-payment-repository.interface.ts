import type { SubscriptionPayment } from '@ged/database';

export interface CreateSubscriptionPaymentData {
  readonly subscriptionId: string;
  readonly paidAt: Date;
  readonly nextBillingDate: Date | null;
  readonly valor: string;
  readonly notes?: string | null;
}

export interface ISubscriptionPaymentRepository {
  create(data: CreateSubscriptionPaymentData): Promise<SubscriptionPayment>;
  findBySubscriptionId(subscriptionId: string): Promise<SubscriptionPayment[]>;
}
