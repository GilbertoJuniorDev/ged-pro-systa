import { IsDateString, IsEnum, IsString, Length, MinLength } from 'class-validator';
import { SEXO } from '@ged/database';
import type { Sexo } from '@ged/database';

export class CreatePessoaFisicaDto {
  @IsString()
  @MinLength(2)
  readonly nome!: string;

  @IsString()
  @MinLength(2)
  readonly sobrenome!: string;

  @IsString()
  @Length(11, 11)
  readonly cpf!: string;

  @IsDateString()
  readonly dataNascimento!: string;

  @IsEnum(SEXO)
  readonly sexo!: Sexo;
}
