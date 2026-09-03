import { IsBoolean, IsInt, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { toBoolean } from '../../../common/transforms/to-boolean';

export class QueryDossieDto {
  @IsOptional()
  @IsUUID()
  readonly departamentoId?: string;

  @IsOptional()
  @IsUUID()
  readonly arquivoId?: string;

  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean()
  readonly semArquivo?: boolean;

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
