import { IsIn, IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ARQUIVO_STATUS, type ArquivoStatus } from '@ged/database';

export class QueryArquivoDto {
  @IsOptional()
  @IsUUID()
  readonly departamentoId?: string;

  @IsOptional()
  @IsIn(Object.values(ARQUIVO_STATUS))
  readonly status?: ArquivoStatus;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  readonly ano?: number;

  @IsOptional()
  @IsString()
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
