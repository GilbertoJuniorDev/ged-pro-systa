export class ModuloResponseDto {
  readonly id!: string;
  readonly nome!: string;
  readonly slug!: string;
  readonly descricao!: string | null;
  readonly icone!: string | null;
  readonly ordem!: number;
  readonly isActive!: boolean;
  readonly createdAt!: Date;
  readonly updatedAt!: Date;

  constructor(partial: ModuloResponseDto) {
    Object.assign(this, partial);
  }
}
