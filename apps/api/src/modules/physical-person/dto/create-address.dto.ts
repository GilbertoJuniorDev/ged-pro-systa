import { IsEnum, IsOptional, IsString, Length, MinLength } from 'class-validator';
import { ADDRESS_TYPE } from '@ged/database';
import type { AddressType } from '@ged/database';

export class CreateAddressDto {
  @IsEnum(ADDRESS_TYPE)
  readonly tipo!: AddressType;

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
