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
import { toBoolean } from '../../../common/transforms/to-boolean';

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

  @IsOptional()
  @IsIn(Object.values(CONFIDENCIALIDADE))
  readonly confidencialidade?: Confidencialidade;

  @IsUUID()
  readonly departamentoId!: string;

  @IsUUID()
  readonly serieId!: string;

  @IsOptional()
  @IsUUID()
  readonly dossieId?: string | null;

  @IsOptional()
  @IsUUID('all', { each: true })
  readonly accessDepartamentoIds?: string[];

  @IsOptional()
  @IsUUID('all', { each: true })
  readonly accessUserIds?: string[];

  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean()
  readonly destaque?: boolean;

  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean()
  readonly exigeCadastro?: boolean;
}
