import { IsBoolean, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CreateDossieDto {
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  readonly nome!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  readonly descricao?: string | null;

  @IsOptional()
  @IsBoolean()
  readonly isActive?: boolean;

  @IsUUID()
  readonly departamentoId!: string;
}
