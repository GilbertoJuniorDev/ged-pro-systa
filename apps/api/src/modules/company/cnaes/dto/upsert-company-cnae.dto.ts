import { IsBoolean, IsOptional, IsString, Length, Matches, MaxLength } from 'class-validator';

export class UpsertCompanyCnaeDto {
  @IsString()
  @Length(7, 7)
  @Matches(/^\d{7}$/, { message: 'codigo must contain exactly 7 digits' })
  readonly codigo!: string;

  @IsString()
  @MaxLength(255)
  readonly descricao!: string;

  @IsOptional()
  @IsBoolean()
  readonly principal?: boolean;
}
