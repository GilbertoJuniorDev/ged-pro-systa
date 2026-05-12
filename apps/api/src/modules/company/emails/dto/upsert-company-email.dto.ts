import { IsEmail, IsIn, IsString, MaxLength } from 'class-validator';
import { EMAIL_TYPE, type EmailType } from '@ged/database';

const TYPES: EmailType[] = [
  EMAIL_TYPE.PRINCIPAL,
  EMAIL_TYPE.FINANCEIRO,
  EMAIL_TYPE.COMERCIAL,
  EMAIL_TYPE.OUTRO,
];

export class UpsertCompanyEmailDto {
  @IsString()
  @IsIn(TYPES)
  readonly tipo!: EmailType;

  @IsEmail()
  @MaxLength(255)
  readonly endereco!: string;
}
