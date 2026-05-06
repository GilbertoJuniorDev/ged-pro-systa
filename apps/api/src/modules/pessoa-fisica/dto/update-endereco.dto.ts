import { IsEnum, IsOptional, IsString, Length, MinLength } from 'class-validator';
import { TIPO_ENDERECO } from '@ged/database';
import type { TipoEndereco } from '@ged/database';

export class UpdateEnderecoDto {
  @IsOptional()
  @IsEnum(TIPO_ENDERECO)
  readonly tipo?: TipoEndereco;

  @IsOptional()
  @IsString()
  @MinLength(3)
  readonly logradouro?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  readonly numero?: string;

  @IsOptional()
  @IsString()
  readonly complemento?: string | null;

  @IsOptional()
  @IsString()
  @MinLength(2)
  readonly bairro?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  readonly cidade?: string;

  @IsOptional()
  @IsString()
  @Length(2, 2)
  readonly estado?: string;

  @IsOptional()
  @IsString()
  @Length(8, 8)
  readonly cep?: string;
}
