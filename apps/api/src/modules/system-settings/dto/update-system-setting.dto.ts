import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateSystemSettingDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  readonly value?: string | null;
}
