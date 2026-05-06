import { IsEnum, IsOptional, IsString, Length, MinLength } from 'class-validator';
import { TIPO_ENDERECO } from '@ged/database';
import type { TipoEndereco } from '@ged/database';

export class CreateEnderecoDto {
  @IsEnum(TIPO_ENDERECO)
  readonly tipo!: TipoEndereco;

  @IsString()
  @MinLength(3)
  readonly logradouro!: string;

  @IsString()
  @MinLength(1)
  readonly numero!: string;

  @IsOptional()
  @IsString()
  readonly complemento?: string | null;

  @IsString()
  @MinLength(2)
  readonly bairro!: string;

  @IsString()
  @MinLength(2)
  readonly cidade!: string;

  @IsString()
  @Length(2, 2)
  readonly estado!: string;

  @IsString()
  @Length(8, 8)
  readonly cep!: string;
}
