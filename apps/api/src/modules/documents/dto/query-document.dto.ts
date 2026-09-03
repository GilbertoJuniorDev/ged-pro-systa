import { IsBoolean, IsIn, IsInt, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import {
  CONFIDENCIALIDADE,
  type Confidencialidade,
  DOCUMENT_FASE,
  type DocumentFase,
} from '@ged/database';
import { toBoolean } from '../../../common/transforms/to-boolean';

export class QueryDocumentDto {
  @IsOptional()
  @IsUUID()
  readonly departamentoId?: string;

  @IsOptional()
  @IsUUID()
  readonly dossieId?: string;

  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean()
  readonly semDossie?: boolean;

  @IsOptional()
  @IsUUID()
  readonly serieId?: string;

  @IsOptional()
  @IsIn(Object.values(DOCUMENT_FASE))
  readonly fase?: DocumentFase;

  @IsOptional()
  @IsIn(Object.values(CONFIDENCIALIDADE))
  readonly confidencialidade?: Confidencialidade;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  readonly search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  readonly page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  readonly limit?: number;
}
