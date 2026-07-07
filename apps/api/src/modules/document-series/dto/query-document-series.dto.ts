import { IsOptional, IsUUID } from 'class-validator';

export class QueryDocumentSeriesDto {
  @IsOptional()
  @IsUUID()
  readonly departamentoId?: string;
}
