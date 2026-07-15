import { Test, type TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { SUBSCRIPTION_STATUS } from '@ged/database';
import type { Subscription } from '@ged/database';
import {
  SubscriptionService,
  SUBSCRIPTION_REPOSITORY,
  SUBSCRIPTION_PAYMENT_REPOSITORY,
} from './subscription.service';
import type { ISubscriptionRepository } from './interfaces/subscription-repository.interface';
import type { ISubscriptionPaymentRepository } from './interfaces/subscription-payment-repository.interface';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

const mockSub = (overrides: Partial<Subscription> = {}): Subscription =>
  ({
    id: 'sub-1',
    status: SUBSCRIPTION_STATUS.ACTIVE,
    planName: null,
    valor: '100.00',
    startDate: new Date('2026-01-01'),
    endDate: null,
    nextBillingDate: null,
    lastPaymentDate: null,
    notes: null,
    singleton: 'X',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  }) as Subscription;

describe('SubscriptionService', () => {
  let service: SubscriptionService;
  let repo: jest.Mocked<ISubscriptionRepository>;
  let paymentRepo: jest.Mocked<ISubscriptionPaymentRepository>;
  let auditLogs: jest.Mocked<Pick<AuditLogsService, 'log'>>;

  beforeEach(async () => {
    repo = {
      findSingleton: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    };
    paymentRepo = {
      create: jest.fn(),
      findBySubscriptionId: jest.fn(),
    };
    auditLogs = { log: jest.fn().mockResolvedValue(undefined) };

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionService,
        { provide: SUBSCRIPTION_REPOSITORY, useValue: repo },
        { provide: SUBSCRIPTION_PAYMENT_REPOSITORY, useValue: paymentRepo },
        { provide: AuditLogsService, useValue: auditLogs },
      ],
    }).compile();

    service = moduleRef.get<SubscriptionService>(SubscriptionService);
  });

  describe('getSingleton', () => {
    it('should throw NotFoundException when no subscription exists', async () => {
      repo.findSingleton.mockResolvedValue(null);
      await expect(service.getSingleton()).rejects.toBeInstanceOf(NotFoundException);
    });

    it('should return subscription when it exists', async () => {
      const sub = mockSub();
      repo.findSingleton.mockResolvedValue(sub);
      await expect(service.getSingleton()).resolves.toBe(sub);
    });
  });

  describe('upsert', () => {
    const data = {
      valor: '200.00',
      startDate: new Date('2026-02-01'),
    };

    it('should create and audit when no existing subscription', async () => {
      repo.findSingleton.mockResolvedValue(null);
      const created = mockSub({ id: 'new-1' });
      repo.create.mockResolvedValue(created);

      const result = await service.upsert('user-1', data);

      expect(repo.create).toHaveBeenCalledWith(data);
      expect(repo.update).not.toHaveBeenCalled();
      expect(auditLogs.log).toHaveBeenCalledWith(
        expect.objectContaining({
          usuarioId: 'user-1',
          acao: 'subscription.created',
          entidadeId: 'new-1',
        }),
      );
      expect(result).toBe(created);
    });

    it('should update and audit when subscription exists', async () => {
      const existing = mockSub();
      repo.findSingleton.mockResolvedValue(existing);
      const updated = mockSub({ valor: '200.00' });
      repo.update.mockResolvedValue(updated);

      const result = await service.upsert('user-1', data);

      expect(repo.update).toHaveBeenCalledWith('sub-1', expect.objectContaining(data));
      expect(repo.create).not.toHaveBeenCalled();
      expect(auditLogs.log).toHaveBeenCalledWith(
        expect.objectContaining({ acao: 'subscription.updated' }),
      );
      expect(result).toBe(updated);
    });
  });

  describe('status transitions', () => {
    it('should suspend and write audit log', async () => {
      repo.findSingleton.mockResolvedValue(mockSub());
      repo.update.mockResolvedValue(mockSub({ status: SUBSCRIPTION_STATUS.SUSPENDED }));

      const result = await service.suspend('user-1');

      expect(repo.update).toHaveBeenCalledWith('sub-1', {
        status: SUBSCRIPTION_STATUS.SUSPENDED,
      });
      expect(auditLogs.log).toHaveBeenCalledWith(
        expect.objectContaining({ acao: 'subscription.status_changed' }),
      );
      expect(result.status).toBe(SUBSCRIPTION_STATUS.SUSPENDED);
    });

    it('should reactivate to ACTIVE', async () => {
      repo.findSingleton.mockResolvedValue(mockSub({ status: SUBSCRIPTION_STATUS.SUSPENDED }));
      repo.update.mockResolvedValue(mockSub({ status: SUBSCRIPTION_STATUS.ACTIVE }));

      await service.reactivate('user-1');

      expect(repo.update).toHaveBeenCalledWith('sub-1', {
        status: SUBSCRIPTION_STATUS.ACTIVE,
      });
    });

    it('should cancel and audit', async () => {
      repo.findSingleton.mockResolvedValue(mockSub());
      repo.update.mockResolvedValue(mockSub({ status: SUBSCRIPTION_STATUS.CANCELLED }));

      await service.cancel('user-1');

      expect(repo.update).toHaveBeenCalledWith('sub-1', {
        status: SUBSCRIPTION_STATUS.CANCELLED,
      });
    });
  });

  describe('recordPayment', () => {
    it('should update payment dates and audit', async () => {
      repo.findSingleton.mockResolvedValue(mockSub());
      repo.update.mockResolvedValue(mockSub());

      const paidAt = new Date('2026-03-10');
      const nextBilling = new Date('2026-04-10');
      await service.recordPayment('user-1', paidAt, nextBilling);

      expect(repo.update).toHaveBeenCalledWith('sub-1', {
        lastPaymentDate: paidAt,
        nextBillingDate: nextBilling,
        status: SUBSCRIPTION_STATUS.ACTIVE,
      });
      expect(auditLogs.log).toHaveBeenCalledWith(
        expect.objectContaining({ acao: 'subscription.payment_recorded' }),
      );
    });

    it('should restore status to ACTIVE when current is OVERDUE', async () => {
      repo.findSingleton.mockResolvedValue(
        mockSub({ status: SUBSCRIPTION_STATUS.OVERDUE }),
      );
      repo.update.mockResolvedValue(mockSub({ status: SUBSCRIPTION_STATUS.ACTIVE }));

      await service.recordPayment('user-1', new Date(), null);

      expect(repo.update).toHaveBeenCalledWith('sub-1', expect.objectContaining({
        status: SUBSCRIPTION_STATUS.ACTIVE,
      }));
    });

    it('should preserve current status when not OVERDUE', async () => {
      repo.findSingleton.mockResolvedValue(
        mockSub({ status: SUBSCRIPTION_STATUS.TRIAL }),
      );
      repo.update.mockResolvedValue(mockSub());

      await service.recordPayment('user-1', new Date(), null);

      expect(repo.update).toHaveBeenCalledWith('sub-1', expect.objectContaining({
        status: SUBSCRIPTION_STATUS.TRIAL,
      }));
    });
  });
});
