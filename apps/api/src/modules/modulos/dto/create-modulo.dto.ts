import { IsBoolean, IsInt, IsOptional, IsString, Matches, MaxLength, Min, MinLength } from 'class-validator';

export class CreateModuloDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  readonly nome!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'slug deve conter apenas letras minúsculas, números e hífens',
  })
  readonly slug!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  readonly descricao?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  readonly icone?: string | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  readonly ordem?: number;
}
