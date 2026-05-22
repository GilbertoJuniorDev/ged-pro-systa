import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SystemSetting } from '@ged/database';

@Injectable()
export class SystemSettingsRepository {
  constructor(
    @InjectRepository(SystemSetting)
    private readonly repo: Repository<SystemSetting>,
  ) {}

  findByKey(key: string): Promise<SystemSetting | null> {
    return this.repo.findOne({ where: { key } });
  }

  async upsert(key: string, value: string | null): Promise<void> {
    await this.repo.upsert({ key, value }, ['key']);
  }
}
