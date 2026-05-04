import { Test } from '@nestjs/testing';
import { MailerService } from '@nestjs-modules/mailer';
import { MailService } from './mail.service';

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
