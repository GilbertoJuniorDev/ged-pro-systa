import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import { CONFIDENCIALIDADE, type Confidencialidade } from '@ged/database';

export class UpdateDocumentDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  readonly nome?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  readonly descricao?: string | null;

  @IsOptional()
  @IsDateString()
  readonly validade?: string | null;

  @IsOptional()
  @IsIn(Object.values(CONFIDENCIALIDADE))
  readonly confidencialidade?: Confidencialidade;

  @IsOptional()
  @IsUUID()
  readonly serieId?: string;

  @IsOptional()
  @IsUUID()
  readonly dossieId?: string | null;

  @IsOptional()
  @IsBoolean()
  readonly isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  readonly destaque?: boolean;

  @IsOptional()
  @IsBoolean()
  readonly exigeCadastro?: boolean;
}
