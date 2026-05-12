import { IsIn, IsString, MaxLength, MinLength } from 'class-validator';
import { PHONE_TYPE, type PhoneType } from '@ged/database';

const TYPES: PhoneType[] = [
  PHONE_TYPE.MOBILE,
  PHONE_TYPE.RESIDENTIAL,
  PHONE_TYPE.COMMERCIAL,
];

export class UpsertCompanyPhoneDto {
  @IsString()
  @IsIn(TYPES)
  readonly tipo!: PhoneType;

  @IsString()
  @MinLength(8)
  @MaxLength(30)
  readonly numero!: string;
}
