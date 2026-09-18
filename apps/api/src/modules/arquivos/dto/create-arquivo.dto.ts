import { IsArray, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CreateArquivoDto {
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  readonly nome!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  readonly descricao?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  readonly predio?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  readonly sala?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  readonly estante?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  readonly prateleira?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  readonly caixa?: string | null;

  @IsUUID()
  readonly departamentoId!: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  readonly departamentoIds?: string[];
}
