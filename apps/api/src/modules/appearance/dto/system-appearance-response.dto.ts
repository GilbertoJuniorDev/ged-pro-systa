export class SystemAppearanceResponseDto {
  readonly primaryColor!: string;
  readonly secondaryColor!: string;
  readonly backgroundColor!: string;
  readonly hasLogo!: boolean;
  readonly logoVersion!: number;
  readonly updatedAt!: string;

  constructor(partial: {
    primaryColor: string;
    secondaryColor: string;
    backgroundColor: string;
    hasLogo: boolean;
    logoVersion: number;
    updatedAt: Date;
  }) {
    this.primaryColor = partial.primaryColor;
    this.secondaryColor = partial.secondaryColor;
    this.backgroundColor = partial.backgroundColor;
    this.hasLogo = partial.hasLogo;
    this.logoVersion = partial.logoVersion;
    this.updatedAt = partial.updatedAt.toISOString();
  }
}
