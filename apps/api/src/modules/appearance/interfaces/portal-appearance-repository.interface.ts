import type { PortalAppearance } from '@ged/database';

export const PORTAL_APPEARANCE_REPOSITORY = 'PORTAL_APPEARANCE_REPOSITORY';

export interface UpdatePortalAppearanceData {
  readonly primaryColor: string;
  readonly secondaryColor: string;
  readonly backgroundColor: string;
  readonly heroTitle: string;
  readonly heroSubtitle: string;
  readonly footerMessage: string;
}

export interface UpdatePortalAppearanceLogoData {
  readonly logoPath: string | null;
  readonly logoMimeType: string | null;
  readonly logoVersion: number;
}

export interface IPortalAppearanceRepository {
  /** A migration semeia a linha singleton — sempre existe exatamente 1. */
  findSingleton(): Promise<PortalAppearance>;
  update(data: UpdatePortalAppearanceData): Promise<PortalAppearance>;
  updateLogo(data: UpdatePortalAppearanceLogoData): Promise<PortalAppearance>;
}
