import { IsBoolean, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class UpdateDossieDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  readonly nome?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  readonly descricao?: string | null;

  @IsOptional()
  @IsBoolean()
  readonly isActive?: boolean;

  @IsOptional()
  @IsUUID()
  readonly arquivoId?: string | null;
}
