import { IsBoolean } from 'class-validator';

export class ToggleUserStatusDto {
  @IsBoolean()
  readonly isActive!: boolean;
}
