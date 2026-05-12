import { IsEnum, IsString, MinLength } from 'class-validator';
import { PHONE_TYPE } from '@ged/database';
import type { PhoneType } from '@ged/database';

export class CreatePhoneDto {
  @IsEnum(PHONE_TYPE)
  readonly tipo!: PhoneType;

  @IsString()
  @MinLength(8)
  readonly numero!: string;
}
