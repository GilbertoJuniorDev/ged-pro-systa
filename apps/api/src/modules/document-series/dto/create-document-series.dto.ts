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

export class CreateDocumentSeriesDto {
  @IsString()
  @MinLength(1)
  @MaxLength(20)
  readonly codigo!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(150)
  readonly nome!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  readonly descricao?: string | null;

  @IsInt()
  @Min(0)
  readonly prazoCorrenteMeses!: number;

  @IsInt()
  @Min(0)
  readonly prazoIntermediarioMeses!: number;

  @IsIn(Object.values(DESTINACAO_FINAL))
  readonly destinacaoFinal!: DestinacaoFinal;

  @IsOptional()
  @IsString()
  readonly baseLegal?: string | null;

  @IsOptional()
  @IsBoolean()
  readonly isActive?: boolean;

  @IsUUID()
  readonly departamentoId!: string;

  @IsOptional()
  @IsUUID()
  readonly seriePaiId?: string | null;
}
