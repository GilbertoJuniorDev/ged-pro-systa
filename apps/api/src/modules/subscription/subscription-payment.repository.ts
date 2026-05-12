import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SubscriptionPayment } from '@ged/database';
import type {
  CreateSubscriptionPaymentData,
  ISubscriptionPaymentRepository,
} from './interfaces/subscription-payment-repository.interface';

@Injectable()
export class SubscriptionPaymentRepository
  implements ISubscriptionPaymentRepository
{
  constructor(
    @InjectRepository(SubscriptionPayment)
    private readonly repo: Repository<SubscriptionPayment>,
  ) {}

  async create(data: CreateSubscriptionPaymentData): Promise<SubscriptionPayment> {
    const entity = this.repo.create(data);
    return this.repo.save(entity);
  }

  findBySubscriptionId(subscriptionId: string): Promise<SubscriptionPayment[]> {
    return this.repo.find({
      where: { subscriptionId },
      order: { paidAt: 'DESC' },
    });
  }
}
