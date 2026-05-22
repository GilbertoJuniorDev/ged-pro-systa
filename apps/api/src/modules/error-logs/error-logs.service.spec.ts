import { Test, type TestingModule } from '@nestjs/testing';
import { ErrorLogsService } from './error-logs.service';
import { ErrorLogsRepository } from './error-logs.repository';
import { ERROR_LOG_LEVEL, ERROR_LOG_SOURCE } from './schemas/error-log.schema';
import { ERROR_LOGS_REDIS_CLIENT } from './error-logs.service';
import { MailService } from '../mail/mail.service';
import { SystemSettingsService } from '../system-settings/system-settings.service';

describe('ErrorLogsService', () => {
  let service: ErrorLogsService;
  let repository: jest.Mocked<ErrorLogsRepository>;
  let mailService: jest.Mocked<Pick<MailService, 'sendCriticalErrorAlert'>>;
  let systemSettingsService: jest.Mocked<Pick<SystemSettingsService, 'get'>>;
  let redisClient: { set: jest.Mock };

  function buildModule(alertEmail: string | undefined = 'admin@ged.local') {
    return Test.createTestingModule({
      providers: [
        ErrorLogsService,
        {
          provide: ErrorLogsRepository,
          useValue: { create: jest.fn(), findAll: jest.fn() },
        },
        {
          provide: MailService,
          useValue: { sendCriticalErrorAlert: jest.fn().mockResolvedValue(undefined) },
        },
        {
          provide: SystemSettingsService,
          useValue: { get: jest.fn().mockResolvedValue(alertEmail ?? null) },
        },
        {
          provide: ERROR_LOGS_REDIS_CLIENT,
          useValue: { set: jest.fn().mockResolvedValue('OK') },
        },
      ],
    }).compile();
  }

  beforeEach(async () => {
    const module: TestingModule = await buildModule();

    service = module.get<ErrorLogsService>(ErrorLogsService);
    repository = module.get(ErrorLogsRepository);
    mailService = module.get(MailService);
    systemSettingsService = module.get(SystemSettingsService);
    redisClient = module.get(ERROR_LOGS_REDIS_CLIENT);
  });

  describe('log — persistence', () => {
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
        context: { user: { id: 1, password: 'p' } },
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

  describe('log — email alert', () => {
    beforeEach(() => {
      repository.create.mockResolvedValue({} as never);
    });

    it('should send alert email when level is error and ERROR_ALERT_EMAIL is set', async () => {
      await service.log({
        source: ERROR_LOG_SOURCE.API,
        level: ERROR_LOG_LEVEL.ERROR,
        message: 'Server crashed',
        statusCode: 500,
        code: 'INTERNAL_SERVER_ERROR',
      });

      // flush microtasks from void promise
      await Promise.resolve();

      expect(mailService.sendCriticalErrorAlert).toHaveBeenCalledTimes(1);
      const [to, data] = (mailService.sendCriticalErrorAlert as jest.Mock).mock.calls[0] as [string, unknown];
      expect(to).toBe('admin@ged.local');
      expect((data as { level: string }).level).toBe(ERROR_LOG_LEVEL.ERROR);
    });

    it('should send alert email when level is fatal', async () => {
      await service.log({
        source: ERROR_LOG_SOURCE.API,
        level: ERROR_LOG_LEVEL.FATAL,
        message: 'Unhandled exception',
      });

      await Promise.resolve();

      expect(mailService.sendCriticalErrorAlert).toHaveBeenCalledTimes(1);
    });

    it('should NOT send email when level is warn', async () => {
      await service.log({
        source: ERROR_LOG_SOURCE.API,
        level: ERROR_LOG_LEVEL.WARN,
        message: 'Not found',
        statusCode: 404,
      });

      await Promise.resolve();

      expect(mailService.sendCriticalErrorAlert).not.toHaveBeenCalled();
    });

    it('should NOT send email when ERROR_ALERT_EMAIL is absent', async () => {
      const module = await buildModule(undefined);
      const svcNoEmail = module.get<ErrorLogsService>(ErrorLogsService);
      module.get<jest.Mocked<ErrorLogsRepository>>(ErrorLogsRepository).create.mockResolvedValue({} as never);

      await svcNoEmail.log({
        source: ERROR_LOG_SOURCE.API,
        level: ERROR_LOG_LEVEL.ERROR,
        message: 'crash',
      });

      await Promise.resolve();

      expect(mailService.sendCriticalErrorAlert).not.toHaveBeenCalled();
    });

    it('should skip email when Redis throttle key already exists (SET NX returns null)', async () => {
      redisClient.set.mockResolvedValue(null);

      await service.log({
        source: ERROR_LOG_SOURCE.API,
        level: ERROR_LOG_LEVEL.ERROR,
        message: 'crash',
        code: 'INTERNAL_SERVER_ERROR',
      });

      await Promise.resolve();

      expect(mailService.sendCriticalErrorAlert).not.toHaveBeenCalled();
    });

    it('should send email when Redis throws (fail-open)', async () => {
      redisClient.set.mockRejectedValue(new Error('ECONNREFUSED'));

      await service.log({
        source: ERROR_LOG_SOURCE.API,
        level: ERROR_LOG_LEVEL.ERROR,
        message: 'crash',
      });

      await Promise.resolve();

      expect(mailService.sendCriticalErrorAlert).toHaveBeenCalledTimes(1);
    });

    it('should not throw when sendCriticalErrorAlert fails (fail-safe)', async () => {
      (mailService.sendCriticalErrorAlert as jest.Mock).mockRejectedValueOnce(new Error('SMTP down'));

      await expect(
        service.log({
          source: ERROR_LOG_SOURCE.API,
          level: ERROR_LOG_LEVEL.FATAL,
          message: 'crash',
        }),
      ).resolves.toBeUndefined();
    });

    it('should not throw and not send email when systemSettingsService.get() throws', async () => {
      (systemSettingsService.get as jest.Mock).mockRejectedValueOnce(
        new Error('DB down'),
      );

      await expect(
        service.log({
          source: ERROR_LOG_SOURCE.API,
          level: ERROR_LOG_LEVEL.FATAL,
          message: 'crash',
        }),
      ).resolves.toBeUndefined();

      await Promise.resolve();

      expect(mailService.sendCriticalErrorAlert).not.toHaveBeenCalled();
    });

    it('should use level+statusCode as throttle key when code is absent', async () => {
      await service.log({
        source: ERROR_LOG_SOURCE.API,
        level: ERROR_LOG_LEVEL.ERROR,
        message: 'crash',
        statusCode: 503,
      });

      await Promise.resolve();

      expect(redisClient.set).toHaveBeenCalledWith(
        'error:alert:error:503',
        '1',
        { NX: true, EX: 300 },
      );
    });

    it('should cover web-client source (all sources alert)', async () => {
      await service.log({
        source: ERROR_LOG_SOURCE.WEB_CLIENT,
        level: ERROR_LOG_LEVEL.FATAL,
        message: 'client crash',
      });

      await Promise.resolve();

      expect(mailService.sendCriticalErrorAlert).toHaveBeenCalledTimes(1);
      const [, data] = (mailService.sendCriticalErrorAlert as jest.Mock).mock.calls[0] as [string, { source: string }];
      expect(data.source).toBe(ERROR_LOG_SOURCE.WEB_CLIENT);
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

  // silence unused-variable warning on systemSettingsService in assertion-only tests
  afterEach(() => { void systemSettingsService; });
});
