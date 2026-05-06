import { IsUUID } from 'class-validator';

export class AssignPermissaoDto {
  @IsUUID()
  readonly permissaoId!: string;
}
