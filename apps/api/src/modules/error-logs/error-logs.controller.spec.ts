import { Test, type TestingModule } from '@nestjs/testing';
import type { Request } from 'express';
import { ErrorLogsController } from './error-logs.controller';
import { ErrorLogsService } from './error-logs.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import {
  ERROR_LOG_LEVEL,
  ERROR_LOG_SOURCE,
} from './schemas/error-log.schema';
import { CreateClientErrorLogDto } from './dto/create-error-log.dto';
import type { QueryErrorLogDto } from './dto/query-error-log.dto';

describe('ErrorLogsController', () => {
  let controller: ErrorLogsController;
  let service: jest.Mocked<ErrorLogsService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ErrorLogsController],
      providers: [
        {
          provide: ErrorLogsService,
          useValue: {
            findAll: jest.fn(),
            log: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get(ErrorLogsController);
    service = module.get(ErrorLogsService);
  });

  describe('GET /error-logs', () => {
    it('should return paginated response mapped from service result', async () => {
      service.findAll.mockResolvedValue({
        data: [
          {
            _id: 'doc-1',
            source: ERROR_LOG_SOURCE.API,
            level: ERROR_LOG_LEVEL.ERROR,
            message: 'm',
            stack: 's',
            code: 'C',
            statusCode: 500,
            method: 'GET',
            url: '/x',
            userAgent: 'ua',
            ip: '1.2.3.4',
            userId: 'u',
            userEmail: 'e',
            requestId: 'r',
            context: { a: 1 },
            createdAt: new Date('2026-01-01T00:00:00Z'),
          },
        ] as never,
        total: 1,
      });

      const query: QueryErrorLogDto = {
        page: 2,
        limit: 5,
        source: ERROR_LOG_SOURCE.API,
      };
      const result = await controller.findAll(query);

      expect(service.findAll).toHaveBeenCalledWith({
        source: ERROR_LOG_SOURCE.API,
        level: undefined,
        statusCode: undefined,
        userId: undefined,
        search: undefined,
        dateFrom: undefined,
        dateTo: undefined,
        page: 2,
        limit: 5,
      });
      expect(result.total).toBe(1);
      expect(result.page).toBe(2);
      expect(result.limit).toBe(5);
      expect(result.data).toHaveLength(1);
      expect(result.data[0]?.id).toBe('doc-1');
      expect(result.data[0]?.message).toBe('m');
    });

    it('should default page/limit when not provided', async () => {
      service.findAll.mockResolvedValue({ data: [], total: 0 });

      const result = await controller.findAll({} as QueryErrorLogDto);

      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });
  });

  describe('POST /error-logs/client', () => {
    it('should forward sanitized payload to service.log with default level=error', async () => {
      const body: CreateClientErrorLogDto = {
        source: 'web-client',
        message: 'client error',
        stack: 'stack',
        url: 'https://app/x',
      } as CreateClientErrorLogDto;

      const req = {
        headers: { 'user-agent': 'jest-ua' },
      } as unknown as Request;

      await controller.reportClient(body, req, '9.9.9.9');

      expect(service.log).toHaveBeenCalledTimes(1);
      const arg = service.log.mock.calls[0]?.[0];
      expect(arg?.source).toBe('web-client');
      expect(arg?.level).toBe(ERROR_LOG_LEVEL.ERROR);
      expect(arg?.message).toBe('client error');
      expect(arg?.stack).toBe('stack');
      expect(arg?.url).toBe('https://app/x');
      expect(arg?.userAgent).toBe('jest-ua');
      expect(arg?.ip).toBe('9.9.9.9');
    });

    it('should respect explicit level when provided', async () => {
      const body = {
        source: 'web-server',
        level: ERROR_LOG_LEVEL.FATAL,
        message: 'm',
      } as CreateClientErrorLogDto;

      const req = { headers: {} } as unknown as Request;
      await controller.reportClient(body, req, '0.0.0.0');

      const arg = service.log.mock.calls[0]?.[0];
      expect(arg?.level).toBe(ERROR_LOG_LEVEL.FATAL);
    });

    it('should prefer body.userAgent over request header', async () => {
      const body = {
        source: 'web-client',
        message: 'm',
        userAgent: 'explicit-ua',
      } as CreateClientErrorLogDto;

      const req = {
        headers: { 'user-agent': 'fallback-ua' },
      } as unknown as Request;

      await controller.reportClient(body, req, '0.0.0.0');

      const arg = service.log.mock.calls[0]?.[0];
      expect(arg?.userAgent).toBe('explicit-ua');
    });
  });
});
