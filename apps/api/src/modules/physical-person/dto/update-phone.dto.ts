import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { PHONE_TYPE } from '@ged/database';
import type { PhoneType } from '@ged/database';

export class UpdatePhoneDto {
  @IsOptional()
  @IsEnum(PHONE_TYPE)
  readonly tipo?: PhoneType;

  @IsOptional()
  @IsString()
  @MinLength(8)
  readonly numero?: string;
}
