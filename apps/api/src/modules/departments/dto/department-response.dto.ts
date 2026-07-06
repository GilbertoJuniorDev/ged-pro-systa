export class DepartmentResponseDto {
  readonly id!: string;
  readonly nome!: string;
  readonly descricao!: string | null;
  readonly isActive!: boolean;
  readonly createdAt!: Date;
  readonly updatedAt!: Date;

  constructor(partial: DepartmentResponseDto) {
    Object.assign(this, partial);
  }
}
