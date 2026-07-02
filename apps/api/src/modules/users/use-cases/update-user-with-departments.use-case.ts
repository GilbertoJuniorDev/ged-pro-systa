import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ROLE, User } from '@ged/database';
import type { Role } from '@ged/types';
import { getAssignableRoles } from '../constants/assignable-roles';
import { UserDepartmentsService } from '../../user-departments/user-departments.service';

export interface UpdateUserWithDepartmentsData {
  readonly id: string;
  readonly actingUserRole: Role;
  readonly data: {
    readonly name?: string;
    readonly role?: Role;
  };
  readonly departamentoIds?: string[];
}

@Injectable()
export class UpdateUserWithDepartmentsUseCase {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly userDepartmentsService: UserDepartmentsService,
  ) {}

  async execute(input: UpdateUserWithDepartmentsData): Promise<User> {
    return this.dataSource.transaction(async (manager) => {
      const existingUser = await manager.findOne(User, { where: { id: input.id } });
      if (!existingUser) {
        throw new NotFoundException('Usuário não encontrado');
      }

      if (input.data.role !== undefined && input.data.role !== existingUser.role) {
        if (existingUser.role === ROLE.SUPER_ADMIN) {
          throw new ForbiddenException('Não é possível alterar o papel do Super Admin');
        }
        if (!getAssignableRoles(input.actingUserRole).includes(input.data.role)) {
          throw new ForbiddenException('Você não tem permissão para atribuir esta função');
        }
        existingUser.role = input.data.role;
      }

      if (input.data.name !== undefined) {
        existingUser.name = input.data.name;
      }

      const savedUser = await manager.save(User, existingUser);

      if (input.departamentoIds !== undefined) {
        await this.userDepartmentsService.syncForUser(input.id, input.departamentoIds, manager);
      }

      return savedUser;
    });
  }
}
