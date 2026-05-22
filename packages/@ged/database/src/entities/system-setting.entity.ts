import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity('system_settings')
export class SystemSetting {
  @PrimaryColumn({ name: 'key', type: 'varchar', length: 100 })
  key!: string;

  @Column({ name: 'value', type: 'text', nullable: true })
  value!: string | null;

  @Column({ name: 'description', type: 'varchar', nullable: true })
  description!: string | null;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
