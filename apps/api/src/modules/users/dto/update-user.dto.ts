import { IsArray, IsIn, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';
import { ROLE } from '@ged/database';
import type { Role } from '@ged/types';

const ALLOWED_ROLES = [ROLE.ADMIN, ROLE.VIEWER] as const;

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  readonly name?: string;

  @IsOptional()
  @IsIn(ALLOWED_ROLES)
  readonly role?: Role;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  readonly departamentoIds?: string[];
}
