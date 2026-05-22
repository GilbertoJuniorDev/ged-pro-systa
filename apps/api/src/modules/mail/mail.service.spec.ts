import { Test } from '@nestjs/testing';
import { MailerService } from '@nestjs-modules/mailer';
import { MailService, type CriticalErrorAlertData } from './mail.service';

describe('MailService', () => {
  let service: MailService;
  let mockMailerService: jest.Mocked<Pick<MailerService, 'sendMail'>>;

  beforeEach(async () => {
    mockMailerService = {
      sendMail: jest.fn().mockResolvedValue({}),
    };

    const module = await Test.createTestingModule({
      providers: [
        MailService,
        { provide: MailerService, useValue: mockMailerService },
      ],
    }).compile();

    service = module.get<MailService>(MailService);
  });

  describe('sendPasswordReset', () => {
    it('should call mailerService.sendMail with correct parameters', async () => {
      const to = 'user@ged.local';
      const resetUrl = 'http://localhost:3000/reset-password?token=abc123';
      const name = 'Test User';

      await service.sendPasswordReset(to, resetUrl, name);

      expect(mockMailerService.sendMail).toHaveBeenCalledWith({
        to,
        subject: 'Redefinição de senha — GED Pro',
        template: 'reset-password',
        context: { name, resetUrl },
      });
    });

    it('should propagate errors from mailerService', async () => {
      mockMailerService.sendMail.mockRejectedValue(new Error('SMTP error'));

      await expect(
        service.sendPasswordReset('fail@ged.local', 'http://example.com', 'User'),
      ).rejects.toThrow('SMTP error');
    });
  });

  describe('sendCriticalErrorAlert', () => {
    const baseData: CriticalErrorAlertData = {
      level: 'fatal',
      statusCode: 500,
      code: 'INTERNAL_SERVER_ERROR',
      source: 'api',
      message: 'Unhandled exception',
      method: 'GET',
      url: '/api/documents',
      userId: 'user-1',
      requestId: 'req-abc',
      stack: 'Error: crash\n    at Object.<anonymous> (/app/src/main.ts:10:5)',
      timestamp: '2026-05-22T10:00:00.000Z',
    };

    it('should call mailerService.sendMail with critical-error template', async () => {
      await service.sendCriticalErrorAlert('admin@ged.local', baseData);

      expect(mockMailerService.sendMail).toHaveBeenCalledTimes(1);
      const call = mockMailerService.sendMail.mock.calls[0]?.[0] as {
        to: string;
        subject: string;
        template: string;
        context: Record<string, unknown>;
      };
      expect(call.to).toBe('admin@ged.local');
      expect(call.template).toBe('critical-error');
      expect(call.subject).toContain('FATAL');
      expect(call.subject).toContain('500');
      expect(call.context['level']).toBe('fatal');
      expect(call.context['message']).toBe('Unhandled exception');
    });

    it('should truncate stack to 3000 characters', async () => {
      const longStack = 'x'.repeat(5_000);

      await service.sendCriticalErrorAlert('admin@ged.local', {
        ...baseData,
        stack: longStack,
      });

      const call = mockMailerService.sendMail.mock.calls[0]?.[0] as {
        context: Record<string, unknown>;
      };
      expect((call.context['stack'] as string).length).toBeLessThanOrEqual(3_000);
    });

    it('should set N/A defaults for absent optional fields', async () => {
      await service.sendCriticalErrorAlert('admin@ged.local', {
        level: 'error',
        source: 'web-client',
        message: 'crash',
        timestamp: '2026-05-22T10:00:00.000Z',
      });

      const call = mockMailerService.sendMail.mock.calls[0]?.[0] as {
        context: Record<string, unknown>;
      };
      expect(call.context['statusCode']).toBe('N/A');
      expect(call.context['code']).toBe('N/A');
      expect(call.context['method']).toBe('N/A');
      expect(call.context['url']).toBe('N/A');
      expect(call.context['stack']).toBeUndefined();
    });

    it('should propagate errors from mailerService', async () => {
      mockMailerService.sendMail.mockRejectedValue(new Error('SMTP down'));

      await expect(
        service.sendCriticalErrorAlert('admin@ged.local', baseData),
      ).rejects.toThrow('SMTP down');
    });
  });
});

describe('MailService', () => {
  let service: MailService;
  let mockMailerService: jest.Mocked<Pick<MailerService, 'sendMail'>>;

  beforeEach(async () => {
    mockMailerService = {
      sendMail: jest.fn().mockResolvedValue({}),
    };

    const module = await Test.createTestingModule({
      providers: [
        MailService,
        { provide: MailerService, useValue: mockMailerService },
      ],
    }).compile();

    service = module.get<MailService>(MailService);
  });

  describe('sendPasswordReset', () => {
    it('should call mailerService.sendMail with correct parameters', async () => {
      const to = 'user@ged.local';
      const resetUrl = 'http://localhost:3000/reset-password?token=abc123';
      const name = 'Test User';

      await service.sendPasswordReset(to, resetUrl, name);

      expect(mockMailerService.sendMail).toHaveBeenCalledWith({
        to,
        subject: 'Redefinição de senha — GED Pro',
        template: 'reset-password',
        context: { name, resetUrl },
      });
    });

    it('should propagate errors from mailerService', async () => {
      mockMailerService.sendMail.mockRejectedValue(new Error('SMTP error'));

      await expect(
        service.sendPasswordReset('fail@ged.local', 'http://example.com', 'User'),
      ).rejects.toThrow('SMTP error');
    });
  });
});
