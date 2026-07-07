import { IsOptional, IsUUID } from 'class-validator';

export class QueryDossieDto {
  @IsOptional()
  @IsUUID()
  readonly departamentoId?: string;
}
