import type { SystemAppearanceAdminDto } from '@ged/types';

export class SystemAppearanceResponseDto implements SystemAppearanceAdminDto {
  readonly primaryColor!: string;
  readonly secondaryColor!: string;
  readonly backgroundColor!: string;
  readonly useDefaultTheme!: boolean;
  readonly hasLogo!: boolean;
  readonly logoVersion!: number;
  readonly updatedAt!: string;

  constructor(partial: {
    primaryColor: string;
    secondaryColor: string;
    backgroundColor: string;
    useDefaultTheme: boolean;
    hasLogo: boolean;
    logoVersion: number;
    updatedAt: Date;
  }) {
    this.primaryColor = partial.primaryColor;
    this.secondaryColor = partial.secondaryColor;
    this.backgroundColor = partial.backgroundColor;
    this.useDefaultTheme = partial.useDefaultTheme;
    this.hasLogo = partial.hasLogo;
    this.logoVersion = partial.logoVersion;
    this.updatedAt = partial.updatedAt.toISOString();
  }
}
