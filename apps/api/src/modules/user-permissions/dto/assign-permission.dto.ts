import { IsUUID } from 'class-validator';

export class AssignPermissionDto {
  @IsUUID()
  readonly permissaoId!: string;
}
