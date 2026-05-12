import { IsIn, IsOptional, IsString, Length, MaxLength, MinLength } from 'class-validator';
import { ADDRESS_TYPE, type AddressType } from '@ged/database';

const TYPES: AddressType[] = [
  ADDRESS_TYPE.RESIDENTIAL,
  ADDRESS_TYPE.COMMERCIAL,
  ADDRESS_TYPE.OTHER,
];

export class UpsertCompanyAddressDto {
  @IsString()
  @IsIn(TYPES)
  readonly tipo!: AddressType;

  @IsString()
  @MinLength(2)
  @MaxLength(200)
  readonly logradouro!: string;

  @IsString()
  @MaxLength(20)
  readonly numero!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  readonly complemento?: string | null;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  readonly bairro!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  readonly cidade!: string;

  @IsString()
  @Length(2, 2)
  readonly estado!: string;

  @IsString()
  @Length(8, 8)
  readonly cep!: string;
}
