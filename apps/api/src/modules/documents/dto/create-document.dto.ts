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
import { Transform } from 'class-transformer';
import { CONFIDENCIALIDADE, type Confidencialidade } from '@ged/database';

// multipart/form-data (used by POST /documents, see FileInterceptor in
// documents.controller.ts) always sends field values as raw strings. Coerce the
// "true"/"false" strings a checkbox/form field sends into real booleans before
// @IsBoolean() runs, while still accepting a real boolean (e.g. JSON callers, tests).
const toBoolean = ({ value }: { value: unknown }): unknown => {
  if (typeof value === 'boolean') return value;
  if (value === 'true') return true;
  if (value === 'false') return false;
  return value;
};

export class CreateDocumentDto {
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  readonly nome!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  readonly descricao?: string | null;

  @IsOptional()
  @IsDateString()
  readonly validade?: string | null;

  @IsIn(Object.values(CONFIDENCIALIDADE))
  readonly confidencialidade!: Confidencialidade;

  @IsUUID()
  readonly departamentoId!: string;

  @IsUUID()
  readonly serieId!: string;

  @IsOptional()
  @IsUUID()
  readonly dossieId?: string | null;

  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean()
  readonly destaque?: boolean;

  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean()
  readonly exigeCadastro?: boolean;
}
