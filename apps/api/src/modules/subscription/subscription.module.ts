import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Subscription, SubscriptionPayment } from '@ged/database';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { RolesGuard } from '../../common/guards/roles.guard';
import { SubscriptionRepository } from './subscription.repository';
import { SubscriptionPaymentRepository } from './subscription-payment.repository';
import {
  SubscriptionService,
  SUBSCRIPTION_REPOSITORY,
  SUBSCRIPTION_PAYMENT_REPOSITORY,
} from './subscription.service';
import { SubscriptionController } from './subscription.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Subscription, SubscriptionPayment]), AuditLogsModule],
  controllers: [SubscriptionController],
  providers: [
    { provide: SUBSCRIPTION_REPOSITORY, useClass: SubscriptionRepository },
    { provide: SUBSCRIPTION_PAYMENT_REPOSITORY, useClass: SubscriptionPaymentRepository },
    SubscriptionService,
    RolesGuard,
  ],
  exports: [SubscriptionService],
})
export class SubscriptionModule {}
