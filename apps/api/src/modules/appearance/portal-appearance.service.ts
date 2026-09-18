import { Inject, Injectable } from '@nestjs/common';
import type { PortalAppearance } from '@ged/database';
import { DEFAULT_PORTAL_APPEARANCE } from '@ged/types';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { LogoStorageService } from './logo-storage.service';
import {
  PORTAL_APPEARANCE_REPOSITORY,
  type IPortalAppearanceRepository,
  type UpdatePortalAppearanceData,
} from './interfaces/portal-appearance-repository.interface';

export interface PortalAppearanceLogoFile {
  readonly stream: NodeJS.ReadableStream;
  readonly mimeType: string;
}

@Injectable()
export class PortalAppearanceService {
  constructor(
    @Inject(PORTAL_APPEARANCE_REPOSITORY)
    private readonly repository: IPortalAppearanceRepository,
    private readonly logoStorage: LogoStorageService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  getSingleton(): Promise<PortalAppearance> {
    return this.repository.findSingleton();
  }

  async update(
    requesterId: string,
    data: UpdatePortalAppearanceData,
  ): Promise<PortalAppearance> {
    const existing = await this.repository.findSingleton();
    const updated = await this.repository.update(data);

    void this.auditLogsService.log({
      usuarioId: requesterId,
      acao: 'portal_appearance.updated',
      entidade: 'portal_appearances',
      entidadeId: updated.id,
      dadosAnteriores: {
        primaryColor: existing.primaryColor,
        secondaryColor: existing.secondaryColor,
        backgroundColor: existing.backgroundColor,
        heroTitle: existing.heroTitle,
        heroSubtitle: existing.heroSubtitle,
        footerMessage: existing.footerMessage,
        useDefaultTheme: existing.useDefaultTheme,
      },
      dadosNovos: {
        primaryColor: updated.primaryColor,
        secondaryColor: updated.secondaryColor,
        backgroundColor: updated.backgroundColor,
        heroTitle: updated.heroTitle,
        heroSubtitle: updated.heroSubtitle,
        footerMessage: updated.footerMessage,
        useDefaultTheme: updated.useDefaultTheme,
      },
    });

    return updated;
  }

  /**
   * Valor EFETIVO da aparência do portal: cores padrão quando `useDefaultTheme` está
   * ligado, cores salvas caso contrário. Usado pelo endpoint público
   * (`GET /public/appearance/portal`), que decide o que é realmente renderizado no
   * portal. Diferente de `getSingleton()`, que devolve o valor CRU para o admin.
   */
  async getEffectiveAppearance(): Promise<PortalAppearance> {
    const setting = await this.repository.findSingleton();
    if (!setting.useDefaultTheme) return setting;
    return {
      ...setting,
      primaryColor: DEFAULT_PORTAL_APPEARANCE.primaryColor,
      secondaryColor: DEFAULT_PORTAL_APPEARANCE.secondaryColor,
      backgroundColor: DEFAULT_PORTAL_APPEARANCE.backgroundColor,
    };
  }

  async uploadLogo(requesterId: string, file: Express.Multer.File): Promise<PortalAppearance> {
    const existing = await this.repository.findSingleton();
    const saved = await this.logoStorage.save('portal', file);

    let updated: PortalAppearance;
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
      acao: 'portal_appearance.logo_updated',
      entidade: 'portal_appearances',
      entidadeId: updated.id,
      dadosAnteriores: { logoPath: existing.logoPath },
      dadosNovos: { logoPath: updated.logoPath },
    });

    return updated;
  }

  async deleteLogo(requesterId: string): Promise<PortalAppearance> {
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
      acao: 'portal_appearance.logo_removed',
      entidade: 'portal_appearances',
      entidadeId: updated.id,
      dadosAnteriores: { logoPath: existing.logoPath },
      dadosNovos: { logoPath: null },
    });

    return updated;
  }

  async getLogoFile(): Promise<PortalAppearanceLogoFile | null> {
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
