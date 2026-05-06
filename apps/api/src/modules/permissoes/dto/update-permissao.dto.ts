import { IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class UpdatePermissaoDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  readonly nome?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  readonly descricao?: string | null;

  @IsOptional()
  @IsUUID()
  readonly moduloId?: string | null;
}
