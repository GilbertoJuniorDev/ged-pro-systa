import { IsEnum, IsOptional, IsString, Length, MinLength } from 'class-validator';
import { ADDRESS_TYPE } from '@ged/database';
import type { AddressType } from '@ged/database';

export class UpdateAddressDto {
  @IsOptional()
  @IsEnum(ADDRESS_TYPE)
  readonly tipo?: AddressType;

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
