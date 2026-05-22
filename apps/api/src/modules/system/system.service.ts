import { Injectable, Inject } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import type { RedisClientType } from 'redis';
import {
  SystemVersionDto,
  AdminSystemVersionDto,
  DependencyDto,
} from './dto/system-version.dto';

export const REDIS_CLIENT = 'REDIS_CLIENT';

const APP_NAME = 'GED Pro';
const BUILD_DATE = new Date().toISOString();

const MAIN_DEPENDENCIES: readonly DependencyDto[] = [
  new DependencyDto({ name: '@nestjs/core', version: '11.0.0', license: 'MIT' }),
  new DependencyDto({ name: 'typeorm', version: '0.3.x', license: 'MIT' }),
  new DependencyDto({ name: 'passport-jwt', version: '4.0.0', license: 'MIT' }),
  new DependencyDto({ name: 'bcrypt', version: '5.1.0', license: 'MIT' }),
  new DependencyDto({ name: 'class-validator', version: '0.14.0', license: 'MIT' }),
];

@Injectable()
export class SystemService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    @Inject(REDIS_CLIENT)
    private readonly redisClient: RedisClientType,
  ) {}

  getVersion(): SystemVersionDto {
    return new SystemVersionDto({
      appName: APP_NAME,
      version: process.env['npm_package_version'] ?? '0.0.1',
      environment: process.env['NODE_ENV'] ?? 'development',
      buildDate: BUILD_DATE,
    });
  }

  async getAdminVersion(): Promise<AdminSystemVersionDto> {
    const base = this.getVersion();

    const [dbStatus, dbVersion] = await this.pingDatabase();
    const redisStatus = await this.pingRedis();

    return new AdminSystemVersionDto({
      ...base,
      nodeVersion: process.version,
      dbVersion,
      dbStatus,
      redisStatus,
      dependencies: MAIN_DEPENDENCIES,
    });
  }

  private async pingDatabase(): Promise<['online' | 'offline', string]> {
    try {
      const result = (await this.dataSource.query('SELECT version()')) as Array<{
        version: string;
      }>;
      const raw = result[0]?.version ?? '';
      const dbVersion = raw.split(',')[0] ?? 'PostgreSQL';
      return ['online', dbVersion];
    } catch {
      return ['offline', 'unavailable'];
    }
  }

  private async pingRedis(): Promise<'online' | 'offline'> {
    try {
      await this.redisClient.ping();
      return 'online';
    } catch {
      return 'offline';
    }
  }
}
