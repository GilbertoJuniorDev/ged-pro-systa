import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateDepartmentDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  readonly nome!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  readonly descricao?: string | null;
}
