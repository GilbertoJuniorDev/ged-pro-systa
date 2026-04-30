import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
  constructor(private readonly mailerService: MailerService) {}

  async sendPasswordReset(
    to: string,
    resetUrl: string,
    name: string,
  ): Promise<void> {
    await this.mailerService.sendMail({
      to,
      subject: 'Redefinição de senha — GED Systa',
      template: 'reset-password',
      context: { name, resetUrl },
    });
  }
}
