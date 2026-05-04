import { IsEmail, IsIn, IsOptional, IsString, MinLength } from 'class-validator';
import { ROLE } from '@ged/database';
import type { Role } from '@ged/types';

const ALLOWED_ROLES = [ROLE.MANAGER, ROLE.VIEWER] as const;

export class CreateUserDto {
  @IsString()
  @MinLength(2)
  readonly name!: string;

  @IsEmail()
  readonly email!: string;

  @IsString()
  @MinLength(8)
  readonly password!: string;

  @IsOptional()
  @IsIn(ALLOWED_ROLES)
  readonly role?: Role;
}
