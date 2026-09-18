import { Inject, Injectable } from '@nestjs/common';
import type { AppearanceSetting } from '@ged/database';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { LogoStorageService } from './logo-storage.service';
import {
  SYSTEM_APPEARANCE_REPOSITORY,
  type ISystemAppearanceRepository,
  type UpdateSystemAppearanceColorsData,
} from './interfaces/system-appearance-repository.interface';

export interface SystemAppearanceLogoFile {
  readonly stream: NodeJS.ReadableStream;
  readonly mimeType: string;
}

@Injectable()
export class SystemAppearanceService {
  constructor(
    @Inject(SYSTEM_APPEARANCE_REPOSITORY)
    private readonly repository: ISystemAppearanceRepository,
    private readonly logoStorage: LogoStorageService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  getSingleton(): Promise<AppearanceSetting> {
    return this.repository.findSingleton();
  }

  async updateColors(
    requesterId: string,
    data: UpdateSystemAppearanceColorsData,
  ): Promise<AppearanceSetting> {
    const existing = await this.repository.findSingleton();
    const updated = await this.repository.updateColors(data);

    void this.auditLogsService.log({
      usuarioId: requesterId,
      acao: 'system_appearance.colors_updated',
      entidade: 'appearance_settings',
      entidadeId: updated.id,
      dadosAnteriores: {
        primaryColor: existing.primaryColor,
        secondaryColor: existing.secondaryColor,
        backgroundColor: existing.backgroundColor,
      },
      dadosNovos: {
        primaryColor: updated.primaryColor,
        secondaryColor: updated.secondaryColor,
        backgroundColor: updated.backgroundColor,
      },
    });

    return updated;
  }

  async uploadLogo(requesterId: string, file: Express.Multer.File): Promise<AppearanceSetting> {
    const existing = await this.repository.findSingleton();
    const saved = await this.logoStorage.save('system', file);

    let updated: AppearanceSetting;
    try {
      updated = await this.repository.updateLogo({
        logoPath: saved.path,
        logoMimeType: saved.mimeType,
        logoVersion: existing.logoVersion + 1,
      });
    } catch (error) {
      await this.logoStorage.delete(saved.path);
      throw error;
    }

    if (existing.logoPath) {
      this.logoStorage.deleteInBackground(existing.logoPath);
    }

    void this.auditLogsService.log({
      usuarioId: requesterId,
      acao: 'system_appearance.logo_updated',
      entidade: 'appearance_settings',
      entidadeId: updated.id,
      dadosAnteriores: { logoPath: existing.logoPath },
      dadosNovos: { logoPath: updated.logoPath },
    });

    return updated;
  }

  async deleteLogo(requesterId: string): Promise<AppearanceSetting> {
    const existing = await this.repository.findSingleton();
    const updated = await this.repository.updateLogo({
      logoPath: null,
      logoMimeType: null,
      logoVersion: existing.logoVersion + 1,
    });

    if (existing.logoPath) {
      this.logoStorage.deleteInBackground(existing.logoPath);
    }

    void this.auditLogsService.log({
      usuarioId: requesterId,
      acao: 'system_appearance.logo_removed',
      entidade: 'appearance_settings',
      entidadeId: updated.id,
      dadosAnteriores: { logoPath: existing.logoPath },
      dadosNovos: { logoPath: null },
    });

    return updated;
  }

  async getLogoFile(): Promise<SystemAppearanceLogoFile | null> {
    const setting = await this.repository.findSingleton();
    if (!setting.logoPath || !setting.logoMimeType) return null;

    const exists = await this.logoStorage.exists(setting.logoPath);
    if (!exists) return null;

    return {
      stream: this.logoStorage.getReadStream(setting.logoPath),
      mimeType: setting.logoMimeType,
    };
  }
}
