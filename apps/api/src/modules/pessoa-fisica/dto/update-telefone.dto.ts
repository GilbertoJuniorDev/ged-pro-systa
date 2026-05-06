import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { TIPO_TELEFONE } from '@ged/database';
import type { TipoTelefone } from '@ged/database';

export class UpdateTelefoneDto {
  @IsOptional()
  @IsEnum(TIPO_TELEFONE)
  readonly tipo?: TipoTelefone;

  @IsOptional()
  @IsString()
  @MinLength(8)
  readonly numero?: string;
}
