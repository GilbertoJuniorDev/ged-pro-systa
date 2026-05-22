import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

export interface CriticalErrorAlertData {
  readonly level: string;
  readonly statusCode?: number;
  readonly code?: string;
  readonly source: string;
  readonly message: string;
  readonly method?: string;
  readonly url?: string;
  readonly userId?: string;
  readonly requestId?: string;
  readonly stack?: string;
  readonly timestamp: string;
}

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
      subject: 'Redefinição de senha — GED Pro',
      template: 'reset-password',
      context: { name, resetUrl },
    });
  }

  async sendCriticalErrorAlert(
    to: string,
    data: CriticalErrorAlertData,
  ): Promise<void> {
    await this.mailerService.sendMail({
      to,
      subject: `[GED Pro] Erro crítico detectado — ${data.level.toUpperCase()} ${data.statusCode ?? ''} ${data.code ?? ''}`.trimEnd(),
      template: 'critical-error',
      context: {
        ...data,
        statusCode: data.statusCode ?? 'N/A',
        code: data.code ?? 'N/A',
        method: data.method ?? 'N/A',
        url: data.url ?? 'N/A',
        stack: data.stack ? data.stack.slice(0, 3_000) : undefined,
      },
    });
  }
}
