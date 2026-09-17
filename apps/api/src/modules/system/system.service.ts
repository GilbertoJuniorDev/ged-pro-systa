import { Injectable, Inject } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import type { RedisClientType } from 'redis';
import * as os from 'node:os';
import { statfs } from 'node:fs/promises';
import {
  SystemVersionDto,
  AdminSystemVersionDto,
  DependencyDto,
} from './dto/system-version.dto';
import {
  SystemResourcesDto,
  CpuResourceDto,
  MemoryResourceDto,
  DiskResourceDto,
} from './dto/system-resources.dto';

const CPU_SAMPLE_INTERVAL_MS = 100;

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

  async getResources(): Promise<SystemResourcesDto> {
    const [cpu, memory, disk] = await Promise.all([
      this.readCpuUsage(),
      Promise.resolve(this.readMemoryUsage()),
      this.readDiskUsage(),
    ]);

    return new SystemResourcesDto({ cpu, memory, disk });
  }

  private async readCpuUsage(): Promise<CpuResourceDto> {
    const start = os.cpus();
    await new Promise((resolve) => setTimeout(resolve, CPU_SAMPLE_INTERVAL_MS));
    const end = os.cpus();

    let idleDelta = 0;
    let totalDelta = 0;
    for (let i = 0; i < end.length; i++) {
      const startTimes = start[i]?.times;
      const endTimes = end[i]?.times;
      if (!startTimes || !endTimes) continue;

      const startTotal = startTimes.user + startTimes.nice + startTimes.sys + startTimes.idle + startTimes.irq;
      const endTotal = endTimes.user + endTimes.nice + endTimes.sys + endTimes.idle + endTimes.irq;

      idleDelta += endTimes.idle - startTimes.idle;
      totalDelta += endTotal - startTotal;
    }

    const usagePercent = totalDelta > 0 ? ((totalDelta - idleDelta) / totalDelta) * 100 : 0;

    return new CpuResourceDto({
      usagePercent: Math.round(usagePercent * 10) / 10,
      cores: end.length,
    });
  }

  private readMemoryUsage(): MemoryResourceDto {
    const totalBytes = os.totalmem();
    const freeBytes = os.freemem();
    const usedBytes = totalBytes - freeBytes;
    const usagePercent = totalBytes > 0 ? (usedBytes / totalBytes) * 100 : 0;

    return new MemoryResourceDto({
      usagePercent: Math.round(usagePercent * 10) / 10,
      totalBytes,
      usedBytes,
      freeBytes,
    });
  }

  private async readDiskUsage(): Promise<DiskResourceDto> {
    try {
      const stats = await statfs(process.cwd());
      const totalBytes = stats.blocks * stats.bsize;
      const freeBytes = stats.bfree * stats.bsize;
      const usedBytes = totalBytes - freeBytes;
      const usagePercent = totalBytes > 0 ? (usedBytes / totalBytes) * 100 : 0;

      return new DiskResourceDto({
        available: true,
        usagePercent: Math.round(usagePercent * 10) / 10,
        totalBytes,
        usedBytes,
      });
    } catch {
      return new DiskResourceDto({
        available: false,
        usagePercent: null,
        totalBytes: null,
        usedBytes: null,
      });
    }
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
