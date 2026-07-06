import { IsBoolean, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateDepartmentDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  readonly nome?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  readonly descricao?: string | null;

  @IsOptional()
  @IsBoolean()
  readonly isActive?: boolean;
}
