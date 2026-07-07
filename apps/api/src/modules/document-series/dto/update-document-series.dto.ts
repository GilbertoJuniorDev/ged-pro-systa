import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { DESTINACAO_FINAL, type DestinacaoFinal } from '@ged/database';

export class UpdateDocumentSeriesDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(20)
  readonly codigo?: string;

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
  @IsInt()
  @Min(0)
  readonly prazoCorrenteMeses?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  readonly prazoIntermediarioMeses?: number;

  @IsOptional()
  @IsIn(Object.values(DESTINACAO_FINAL))
  readonly destinacaoFinal?: DestinacaoFinal;

  @IsOptional()
  @IsString()
  readonly baseLegal?: string | null;

  @IsOptional()
  @IsBoolean()
  readonly isActive?: boolean;

  @IsOptional()
  @IsUUID()
  readonly seriePaiId?: string;
}
