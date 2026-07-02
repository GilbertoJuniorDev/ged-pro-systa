import type { Role } from '@ged/types';

export class UserResponseDto {
  readonly id!: string;
  readonly name!: string;
  readonly email!: string;
  readonly role!: Role;
  readonly isActive!: boolean;
  readonly createdAt!: Date;
  readonly departamentoIds!: string[];

  constructor(partial: UserResponseDto) {
    Object.assign(this, partial);
  }
}
