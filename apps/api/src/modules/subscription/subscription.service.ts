import {
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SUBSCRIPTION_STATUS } from '@ged/database';
import type { Subscription, SubscriptionPayment, SubscriptionStatus } from '@ged/database';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import type {
  ISubscriptionRepository,
  UpsertSubscriptionData,
} from './interfaces/subscription-repository.interface';
import type { ISubscriptionPaymentRepository } from './interfaces/subscription-payment-repository.interface';

export const SUBSCRIPTION_REPOSITORY = 'SUBSCRIPTION_REPOSITORY';
export const SUBSCRIPTION_PAYMENT_REPOSITORY = 'SUBSCRIPTION_PAYMENT_REPOSITORY';

@Injectable()
export class SubscriptionService {
  constructor(
    @Inject(SUBSCRIPTION_REPOSITORY)
    private readonly subscriptionRepository: ISubscriptionRepository,
    @Inject(SUBSCRIPTION_PAYMENT_REPOSITORY)
    private readonly paymentRepository: ISubscriptionPaymentRepository,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async getSingleton(): Promise<Subscription> {
    const sub = await this.subscriptionRepository.findSingleton();
    if (!sub) throw new NotFoundException('Subscription not registered');
    return sub;
  }

  findSingletonOrNull(): Promise<Subscription | null> {
    return this.subscriptionRepository.findSingleton();
  }

  async upsert(
    requesterId: string,
    data: UpsertSubscriptionData,
  ): Promise<Subscription> {
    const existing = await this.subscriptionRepository.findSingleton();

    if (existing) {
      const updated = await this.subscriptionRepository.update(existing.id, {
        ...data,
      });
      await this.auditLogsService.log({
        usuarioId: requesterId,
        acao: 'subscription.updated',
        entidade: 'subscription',
        entidadeId: updated.id,
        dadosAnteriores: { id: existing.id, status: existing.status, valor: existing.valor },
        dadosNovos: { id: updated.id, status: updated.status, valor: updated.valor },
      });
      return updated;
    }

    const created = await this.subscriptionRepository.create(data);
    await this.auditLogsService.log({
      usuarioId: requesterId,
      acao: 'subscription.created',
      entidade: 'subscription',
      entidadeId: created.id,
      dadosAnteriores: null,
      dadosNovos: { id: created.id, status: created.status, valor: created.valor },
    });
    return created;
  }

  suspend(requesterId: string): Promise<Subscription> {
    return this.changeStatus(requesterId, SUBSCRIPTION_STATUS.SUSPENDED);
  }

  reactivate(requesterId: string): Promise<Subscription> {
    return this.changeStatus(requesterId, SUBSCRIPTION_STATUS.ACTIVE);
  }

  cancel(requesterId: string): Promise<Subscription> {
    return this.changeStatus(requesterId, SUBSCRIPTION_STATUS.CANCELLED);
  }

  async recordPayment(
    requesterId: string,
    paidAt: Date,
    nextBillingDate: Date | null,
  ): Promise<Subscription> {
    const current = await this.getSingleton();

    const patchStatus =
      current.status === SUBSCRIPTION_STATUS.OVERDUE
        ? SUBSCRIPTION_STATUS.ACTIVE
        : current.status;

    const updated = await this.subscriptionRepository.update(current.id, {
      lastPaymentDate: paidAt,
      nextBillingDate,
      status: patchStatus,
    });

    await this.paymentRepository.create({
      subscriptionId: updated.id,
      paidAt,
      nextBillingDate,
      valor: updated.valor,
    });

    await this.auditLogsService.log({
      usuarioId: requesterId,
      acao: 'subscription.payment_recorded',
      entidade: 'subscription',
      entidadeId: updated.id,
      dadosAnteriores: { id: current.id, status: current.status, lastPaymentDate: current.lastPaymentDate, nextBillingDate: current.nextBillingDate },
      dadosNovos: { id: updated.id, status: updated.status, lastPaymentDate: updated.lastPaymentDate, nextBillingDate: updated.nextBillingDate },
    });

    return updated;
  }

  listPayments(subscriptionId: string): Promise<SubscriptionPayment[]> {
    return this.paymentRepository.findBySubscriptionId(subscriptionId);
  }

  private async changeStatus(
    requesterId: string,
    next: SubscriptionStatus,
  ): Promise<Subscription> {
    const current = await this.getSingleton();
    const updated = await this.subscriptionRepository.update(current.id, {
      status: next,
    });
    await this.auditLogsService.log({
      usuarioId: requesterId,
      acao: 'subscription.status_changed',
      entidade: 'subscription',
      entidadeId: updated.id,
      dadosAnteriores: { id: current.id, status: current.status },
      dadosNovos: { id: updated.id, status: updated.status },
    });
    return updated;
  }
}
