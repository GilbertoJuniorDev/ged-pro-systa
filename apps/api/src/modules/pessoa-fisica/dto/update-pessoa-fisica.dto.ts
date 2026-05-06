import { IsDateString, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { SEXO } from '@ged/database';
import type { Sexo } from '@ged/database';

export class UpdatePessoaFisicaDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  readonly nome?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  readonly sobrenome?: string;

  @IsOptional()
  @IsDateString()
  readonly dataNascimento?: string;

  @IsOptional()
  @IsEnum(SEXO)
  readonly sexo?: Sexo;
}
