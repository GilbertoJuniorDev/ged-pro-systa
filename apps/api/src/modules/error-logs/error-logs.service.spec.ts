import { Test, type TestingModule } from '@nestjs/testing';
import { ErrorLogsService } from './error-logs.service';
import { ErrorLogsRepository } from './error-logs.repository';
import { ERROR_LOG_LEVEL, ERROR_LOG_SOURCE } from './schemas/error-log.schema';

describe('ErrorLogsService', () => {
  let service: ErrorLogsService;
  let repository: jest.Mocked<ErrorLogsRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ErrorLogsService,
        {
          provide: ErrorLogsRepository,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ErrorLogsService>(ErrorLogsService);
    repository = module.get(ErrorLogsRepository);
  });

  describe('log', () => {
    it('should call repository.create with sanitized payload when context contains sensitive keys', async () => {
      repository.create.mockResolvedValue({} as never);

      await service.log({
        source: ERROR_LOG_SOURCE.API,
        level: ERROR_LOG_LEVEL.ERROR,
        message: 'Test error',
        context: {
          password: 'secret123',
          token: 'jwt-xxx',
          accessToken: 'a',
          refreshToken: 'r',
          authorization: 'Bearer xyz',
          cookie: 'session=1',
          secret: 's',
          safeField: 'visible',
        },
      });

      expect(repository.create).toHaveBeenCalledTimes(1);
      const arg = repository.create.mock.calls[0]?.[0];
      const ctx = arg?.context as Record<string, unknown>;
      expect(ctx.password).toBe('[REDACTED]');
      expect(ctx.token).toBe('[REDACTED]');
      expect(ctx.accessToken).toBe('[REDACTED]');
      expect(ctx.refreshToken).toBe('[REDACTED]');
      expect(ctx.authorization).toBe('[REDACTED]');
      expect(ctx.cookie).toBe('[REDACTED]');
      expect(ctx.secret).toBe('[REDACTED]');
      expect(ctx.safeField).toBe('visible');
    });

    it('should sanitize sensitive keys in nested objects', async () => {
      repository.create.mockResolvedValue({} as never);

      await service.log({
        source: ERROR_LOG_SOURCE.API,
        level: ERROR_LOG_LEVEL.ERROR,
        message: 'nested',
        context: {
          user: { id: 1, password: 'p' },
        },
      });

      const arg = repository.create.mock.calls[0]?.[0];
      const ctx = arg?.context as Record<string, Record<string, unknown>>;
      expect(ctx.user.id).toBe(1);
      expect(ctx.user.password).toBe('[REDACTED]');
    });

    it('should not pass context when context is undefined', async () => {
      repository.create.mockResolvedValue({} as never);

      await service.log({
        source: ERROR_LOG_SOURCE.API,
        level: ERROR_LOG_LEVEL.ERROR,
        message: 'no ctx',
      });

      const arg = repository.create.mock.calls[0]?.[0];
      expect(arg?.context).toBeUndefined();
    });

    it('should not throw when repository.create fails (fail-safe)', async () => {
      repository.create.mockRejectedValue(new Error('mongo down'));

      await expect(
        service.log({
          source: ERROR_LOG_SOURCE.API,
          level: ERROR_LOG_LEVEL.ERROR,
          message: 'fail-safe',
        }),
      ).resolves.toBeUndefined();
    });
  });

  describe('findAll', () => {
    it('should delegate to repository.findAll with provided filter', async () => {
      const expected = { data: [], total: 0 };
      repository.findAll.mockResolvedValue(expected as never);

      const filter = { source: ERROR_LOG_SOURCE.API, page: 1, limit: 10 };
      const result = await service.findAll(filter);

      expect(repository.findAll).toHaveBeenCalledWith(filter);
      expect(result).toBe(expected);
    });
  });
});
