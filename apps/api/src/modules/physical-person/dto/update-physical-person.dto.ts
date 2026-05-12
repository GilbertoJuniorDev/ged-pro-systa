import { IsDateString, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { GENDER } from '@ged/database';
import type { Gender } from '@ged/database';

export class UpdatePhysicalPersonDto {
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
  @IsEnum(GENDER)
  readonly sexo?: Gender;
}
