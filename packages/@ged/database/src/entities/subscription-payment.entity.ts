import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Subscription } from './subscription.entity';

/**
 * SubscriptionPayment — histórico de pagamentos da assinatura.
 *
 * Cada registro representa um pagamento registrado via
 * POST /subscription/record-payment.
 */
@Entity('subscription_payments')
export class SubscriptionPayment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'subscription_id', type: 'uuid' })
  subscriptionId!: string;

  @ManyToOne(() => Subscription, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'subscription_id' })
  subscription!: Subscription;

  @Column({ name: 'paid_at', type: 'date' })
  paidAt!: Date;

  @Column({ name: 'next_billing_date', type: 'date', nullable: true })
  nextBillingDate!: Date | null;

  @Column({
    name: 'valor',
    type: 'decimal',
    precision: 10,
    scale: 2,
  })
  valor!: string;

  @Column({ name: 'notes', type: 'text', nullable: true })
  notes!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
