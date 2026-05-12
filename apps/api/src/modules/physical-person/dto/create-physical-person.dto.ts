import { IsDateString, IsEnum, IsString, Length, MinLength } from 'class-validator';
import { GENDER } from '@ged/database';
import type { Gender } from '@ged/database';

export class CreatePhysicalPersonDto {
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

  @IsEnum(GENDER)
  readonly sexo!: Gender;
}
