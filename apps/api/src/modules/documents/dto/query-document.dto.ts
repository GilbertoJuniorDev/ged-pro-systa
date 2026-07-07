import { IsIn, IsInt, IsOptional, IsUUID, Min } from 'class-validator';
import { Type } from 'class-transformer';
import {
  CONFIDENCIALIDADE,
  type Confidencialidade,
  DOCUMENT_FASE,
  type DocumentFase,
} from '@ged/database';

export class QueryDocumentDto {
  @IsOptional()
  @IsUUID()
  readonly departamentoId?: string;

  @IsOptional()
  @IsUUID()
  readonly dossieId?: string;

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
