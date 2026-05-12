import {
  IsBoolean,
  IsDateString,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpsertCompanyDto {
  @IsString()
  @Length(14, 14)
  @Matches(/^\d{14}$/, { message: 'cnpj must contain exactly 14 digits' })
  readonly cnpj!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(200)
  readonly razaoSocial!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  readonly nomeFantasia?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  readonly nomeEmpresarial?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  readonly inscricaoEstadual?: string | null;

  @IsOptional()
  @IsBoolean()
  readonly matriz?: boolean;

  @IsOptional()
  @IsDateString()
  readonly dataAbertura?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  readonly porte?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  readonly naturezaJuridicaCodigo?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  readonly naturezaJuridicaDescricao?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  readonly situacaoCadastral?: string | null;

  @IsOptional()
  @IsDateString()
  readonly situacaoCadastralData?: string | null;
}
