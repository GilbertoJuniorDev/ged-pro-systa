import { IsEnum, IsString, MinLength } from 'class-validator';
import { TIPO_TELEFONE } from '@ged/database';
import type { TipoTelefone } from '@ged/database';

export class CreateTelefoneDto {
  @IsEnum(TIPO_TELEFONE)
  readonly tipo!: TipoTelefone;

  @IsString()
  @MinLength(8)
  readonly numero!: string;
}
