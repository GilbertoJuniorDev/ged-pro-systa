import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subscription } from '@ged/database';
import type {
  ISubscriptionRepository,
  UpdateSubscriptionPatch,
  UpsertSubscriptionData,
} from './interfaces/subscription-repository.interface';

@Injectable()
export class SubscriptionRepository implements ISubscriptionRepository {
  constructor(
    @InjectRepository(Subscription)
    private readonly repo: Repository<Subscription>,
  ) {}

  findSingleton(): Promise<Subscription | null> {
    return this.repo.findOne({ where: {} });
  }

  async create(data: UpsertSubscriptionData): Promise<Subscription> {
    const created = this.repo.create(data);
    return this.repo.save(created);
  }

  async update(id: string, data: UpdateSubscriptionPatch): Promise<Subscription> {
    await this.repo.update(id, data);
    return this.repo.findOneOrFail({ where: { id } });
  }
}
