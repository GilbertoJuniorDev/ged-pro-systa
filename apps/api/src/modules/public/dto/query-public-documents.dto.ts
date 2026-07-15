import { IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryPublicDocumentsDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  readonly search?: string;

  @IsOptional()
  @IsUUID()
  readonly serieId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  readonly page?: number;

  // Não rejeita valores acima do limite máximo: o repositório aplica o cap (100), igual ao
  // padrão de QueryDocumentDto/documents.repository.ts (clamp silencioso, não 400).
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  readonly limit?: number;
}

// Query de `GET /public/documents/recentes?limit=` — cap explícito via @Max porque o
// endpoint não pagina; um valor absurdamente alto não deve nem chegar ao clamp do
// repositório (que também aplica um cap defensivo de 20 como segunda linha de defesa).
export class QueryRecentesDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  readonly limit?: number;
}
