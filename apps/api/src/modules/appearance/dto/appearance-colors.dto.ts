import { IsString, Matches } from 'class-validator';

export const HEX_COLOR_PATTERN = /^#[0-9A-Fa-f]{6}$/;
const HEX_COLOR_MESSAGE = 'Cor deve estar no formato #RRGGBB';

export abstract class AppearanceColorsDto {
  @IsString()
  @Matches(HEX_COLOR_PATTERN, { message: HEX_COLOR_MESSAGE })
  readonly primaryColor!: string;

  @IsString()
  @Matches(HEX_COLOR_PATTERN, { message: HEX_COLOR_MESSAGE })
  readonly secondaryColor!: string;

  @IsString()
  @Matches(HEX_COLOR_PATTERN, { message: HEX_COLOR_MESSAGE })
  readonly backgroundColor!: string;
}
