export class UserPermissionResponseDto {
  readonly id!: string;
  readonly usuarioId!: string;
  readonly permissaoId!: string;
  readonly permissaoNome!: string;
  readonly permissaoDescricao!: string | null;
  readonly createdAt!: Date;

  constructor(partial: UserPermissionResponseDto) {
    Object.assign(this, partial);
  }
}
