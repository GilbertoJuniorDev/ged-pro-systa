import { IsArray, IsEmail, IsIn, IsOptional, IsString, IsUUID, MinLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ROLE } from '@ged/database';
import type { Role } from '@ged/types';
import { CreatePhysicalPersonDto } from '../../physical-person/dto/create-physical-person.dto';

const ALLOWED_ROLES = [ROLE.ADMIN, ROLE.VIEWER] as const;

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

  @ValidateNested()
  @Type(() => CreatePhysicalPersonDto)
  readonly pessoaFisica!: CreatePhysicalPersonDto;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  readonly permissaoIds?: string[];

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  readonly departamentoIds?: string[];
}
