import { IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class QueryAuditLogDto {
  @IsOptional()
  @IsString()
  readonly usuarioId?: string;

  @IsOptional()
  @IsString()
  readonly acao?: string;

  @IsOptional()
  @IsString()
  readonly entidade?: string;

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
