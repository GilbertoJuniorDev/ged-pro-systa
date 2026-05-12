import type { Subscription, SubscriptionStatus } from '@ged/database';

export interface UpsertSubscriptionData {
  readonly status?: SubscriptionStatus;
  readonly planName?: string | null;
  readonly valor: string;
  readonly startDate: Date;
  readonly endDate?: Date | null;
  readonly nextBillingDate?: Date | null;
  readonly notes?: string | null;
}

export interface UpdateSubscriptionPatch {
  readonly status?: SubscriptionStatus;
  readonly planName?: string | null;
  readonly valor?: string;
  readonly startDate?: Date;
  readonly endDate?: Date | null;
  readonly nextBillingDate?: Date | null;
  readonly lastPaymentDate?: Date | null;
  readonly notes?: string | null;
}

export interface ISubscriptionRepository {
  findSingleton(): Promise<Subscription | null>;
  create(data: UpsertSubscriptionData): Promise<Subscription>;
  update(id: string, data: UpdateSubscriptionPatch): Promise<Subscription>;
}
