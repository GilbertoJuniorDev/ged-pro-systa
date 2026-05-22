import { Test, type TestingModule } from '@nestjs/testing';
import { SystemSettingsService } from './system-settings.service';
import { SystemSettingsRepository } from './system-settings.repository';
import type { SystemSetting } from '@ged/database';

const makeSetting = (value: string | null): SystemSetting =>
  ({ key: 'test_key', value, description: null, updatedAt: new Date() } as SystemSetting);

describe('SystemSettingsService', () => {
  let service: SystemSettingsService;
  let repo: jest.Mocked<SystemSettingsRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SystemSettingsService,
        {
          provide: SystemSettingsRepository,
          useValue: {
            findByKey: jest.fn(),
            upsert: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(SystemSettingsService);
    repo = module.get(SystemSettingsRepository);
  });

  describe('get()', () => {
    it('should fetch from repository on cache miss and return value', async () => {
      repo.findByKey.mockResolvedValue(makeSetting('admin@ged.local'));

      const result = await service.get('test_key');

      expect(result).toBe('admin@ged.local');
      expect(repo.findByKey).toHaveBeenCalledWith('test_key');
    });

    it('should return null when setting does not exist in DB', async () => {
      repo.findByKey.mockResolvedValue(null);

      const result = await service.get('test_key');

      expect(result).toBeNull();
    });

    it('should return cached value on subsequent calls without hitting DB again', async () => {
      repo.findByKey.mockResolvedValue(makeSetting('cached@ged.local'));

      await service.get('test_key');
      await service.get('test_key');

      expect(repo.findByKey).toHaveBeenCalledTimes(1);
    });

    it('should return null when setting has null value', async () => {
      repo.findByKey.mockResolvedValue(makeSetting(null));

      const result = await service.get('test_key');

      expect(result).toBeNull();
    });
  });

  describe('set()', () => {
    it('should persist value via repository', async () => {
      repo.upsert.mockResolvedValue(undefined);

      await service.set('test_key', 'new@ged.local');

      expect(repo.upsert).toHaveBeenCalledWith('test_key', 'new@ged.local');
    });

    it('should invalidate cache so next get() hits the DB', async () => {
      repo.findByKey
        .mockResolvedValueOnce(makeSetting('old@ged.local'))
        .mockResolvedValueOnce(makeSetting('new@ged.local'));
      repo.upsert.mockResolvedValue(undefined);

      await service.get('test_key'); // populates cache
      await service.set('test_key', 'new@ged.local'); // invalidates
      const result = await service.get('test_key'); // cache miss → DB

      expect(result).toBe('new@ged.local');
      expect(repo.findByKey).toHaveBeenCalledTimes(2);
    });

    it('should persist null value to clear the setting', async () => {
      repo.upsert.mockResolvedValue(undefined);

      await service.set('test_key', null);

      expect(repo.upsert).toHaveBeenCalledWith('test_key', null);
    });
  });
});
