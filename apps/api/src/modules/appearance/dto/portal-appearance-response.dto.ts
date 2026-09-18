export class PortalAppearanceResponseDto {
  readonly primaryColor!: string;
  readonly secondaryColor!: string;
  readonly backgroundColor!: string;
  readonly hasLogo!: boolean;
  readonly logoVersion!: number;
  readonly heroTitle!: string;
  readonly heroSubtitle!: string;
  readonly footerMessage!: string;
  readonly updatedAt!: string;

  constructor(partial: {
    primaryColor: string;
    secondaryColor: string;
    backgroundColor: string;
    hasLogo: boolean;
    logoVersion: number;
    heroTitle: string;
    heroSubtitle: string;
    footerMessage: string;
    updatedAt: Date;
  }) {
    this.primaryColor = partial.primaryColor;
    this.secondaryColor = partial.secondaryColor;
    this.backgroundColor = partial.backgroundColor;
    this.hasLogo = partial.hasLogo;
    this.logoVersion = partial.logoVersion;
    this.heroTitle = partial.heroTitle;
    this.heroSubtitle = partial.heroSubtitle;
    this.footerMessage = partial.footerMessage;
    this.updatedAt = partial.updatedAt.toISOString();
  }
}
