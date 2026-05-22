import { Test, type TestingModule } from '@nestjs/testing';
import { getDataSourceToken } from '@nestjs/typeorm';
import { SystemService, REDIS_CLIENT } from './system.service';
import type { SystemVersionDto } from './dto/system-version.dto';

function makeVersionDto(): SystemVersionDto {
  return {
    appName: 'GED Pro',
    version: '0.0.1',
    environment: 'test',
    buildDate: expect.any(String) as unknown as string,
  };
}

describe('SystemService', () => {
  let service: SystemService;
  let mockDataSource: { query: jest.Mock };
  let mockRedisClient: { ping: jest.Mock };

  beforeEach(async () => {
    mockDataSource = { query: jest.fn() };
    mockRedisClient = { ping: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SystemService,
        { provide: getDataSourceToken(), useValue: mockDataSource },
        { provide: REDIS_CLIENT, useValue: mockRedisClient },
      ],
    }).compile();

    service = module.get<SystemService>(SystemService);
  });

  describe('getVersion', () => {
    it('should return SystemVersionDto with correct shape', () => {
      const result = service.getVersion();

      expect(result.appName).toBe('GED Pro');
      expect(result.version).toBeDefined();
      expect(result.environment).toBeDefined();
      expect(result.buildDate).toBeDefined();
    });
  });

  describe('getAdminVersion', () => {
    it('should return dbStatus online when database responds', async () => {
      mockDataSource.query.mockResolvedValue([
        { version: 'PostgreSQL 17.0 on x86_64-pc-linux-gnu, compiled by gcc' },
      ]);
      mockRedisClient.ping.mockResolvedValue('PONG');

      const result = await service.getAdminVersion();

      expect(result.dbStatus).toBe('online');
      expect(result.dbVersion).toContain('PostgreSQL');
    });

    it('should return dbStatus offline when database throws', async () => {
      mockDataSource.query.mockRejectedValue(new Error('connection refused'));
      mockRedisClient.ping.mockResolvedValue('PONG');

      const result = await service.getAdminVersion();

      expect(result.dbStatus).toBe('offline');
      expect(result.dbVersion).toBe('unavailable');
    });

    it('should return redisStatus online when redis pings successfully', async () => {
      mockDataSource.query.mockResolvedValue([{ version: 'PostgreSQL 17.0' }]);
      mockRedisClient.ping.mockResolvedValue('PONG');

      const result = await service.getAdminVersion();

      expect(result.redisStatus).toBe('online');
    });

    it('should return redisStatus offline when redis throws', async () => {
      mockDataSource.query.mockResolvedValue([{ version: 'PostgreSQL 17.0' }]);
      mockRedisClient.ping.mockRejectedValue(new Error('ECONNREFUSED'));

      const result = await service.getAdminVersion();

      expect(result.redisStatus).toBe('offline');
    });

    it('should include nodeVersion and dependencies in result', async () => {
      mockDataSource.query.mockResolvedValue([{ version: 'PostgreSQL 17.0' }]);
      mockRedisClient.ping.mockResolvedValue('PONG');

      const result = await service.getAdminVersion();

      expect(result.nodeVersion).toBe(process.version);
      expect(result.dependencies.length).toBeGreaterThan(0);
    });

    it('should extend base version fields in admin result', async () => {
      mockDataSource.query.mockResolvedValue([{ version: 'PostgreSQL 17.0' }]);
      mockRedisClient.ping.mockResolvedValue('PONG');

      const base = service.getVersion();
      const result = await service.getAdminVersion();

      expect(result.appName).toBe(base.appName);
      expect(result.version).toBe(base.version);
      expect(result.environment).toBe(base.environment);
    });

    it('should never throw even when both db and redis fail', async () => {
      mockDataSource.query.mockRejectedValue(new Error('db down'));
      mockRedisClient.ping.mockRejectedValue(new Error('redis down'));

      await expect(service.getAdminVersion()).resolves.toBeDefined();
    });
  });
});
