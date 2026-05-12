import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export const SUBSCRIPTION_STATUS = {
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
  CANCELLED: 'CANCELLED',
  OVERDUE: 'OVERDUE',
  TRIAL: 'TRIAL',
} as const;

export type SubscriptionStatus =
  (typeof SUBSCRIPTION_STATUS)[keyof typeof SUBSCRIPTION_STATUS];

/**
 * Subscription — singleton entity.
 *
 * Cada instância (container) tem uma única assinatura ativa do cliente.
 * Garantida via coluna sentinel `singleton` (UNIQUE + CHECK).
 */
@Entity('subscription')
export class Subscription {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    name: 'status',
    type: 'enum',
    enum: ['ACTIVE', 'SUSPENDED', 'CANCELLED', 'OVERDUE', 'TRIAL'],
    default: SUBSCRIPTION_STATUS.ACTIVE,
  })
  status!: SubscriptionStatus;

  @Column({ name: 'plan_name', nullable: true, type: 'varchar' })
  planName!: string | null;

  @Column({
    name: 'valor',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  valor!: string;

  @Column({ name: 'start_date', type: 'date' })
  startDate!: Date;

  @Column({ name: 'end_date', type: 'date', nullable: true })
  endDate!: Date | null;

  @Column({ name: 'next_billing_date', type: 'date', nullable: true })
  nextBillingDate!: Date | null;

  @Column({ name: 'last_payment_date', type: 'date', nullable: true })
  lastPaymentDate!: Date | null;

  @Column({ name: 'notes', type: 'text', nullable: true })
  notes!: string | null;

  @Column({
    name: 'singleton',
    type: 'char',
    length: 1,
    default: 'X',
    unique: true,
    select: false,
  })
  readonly singleton!: 'X';

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
