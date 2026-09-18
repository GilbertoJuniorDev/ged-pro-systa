import type { AppearanceSetting } from '@ged/database';

export const SYSTEM_APPEARANCE_REPOSITORY = 'SYSTEM_APPEARANCE_REPOSITORY';

export interface UpdateSystemAppearanceColorsData {
  readonly primaryColor: string;
  readonly secondaryColor: string;
  readonly backgroundColor: string;
}

export interface UpdateSystemAppearanceLogoData {
  readonly logoPath: string | null;
  readonly logoMimeType: string | null;
  readonly logoVersion: number;
}

export interface ISystemAppearanceRepository {
  /** A migration semeia a linha singleton — sempre existe exatamente 1. */
  findSingleton(): Promise<AppearanceSetting>;
  updateColors(data: UpdateSystemAppearanceColorsData): Promise<AppearanceSetting>;
  updateLogo(data: UpdateSystemAppearanceLogoData): Promise<AppearanceSetting>;
}
