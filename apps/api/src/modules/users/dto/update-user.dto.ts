import { IsIn, IsOptional, IsString, MinLength } from 'class-validator';
import { ROLE } from '@ged/database';
import type { Role } from '@ged/types';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  readonly name?: string;

  @IsOptional()
  @IsIn([ROLE.MANAGER, ROLE.VIEWER])
  readonly role?: Role;
}
