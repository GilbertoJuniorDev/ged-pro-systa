import { BadRequestException, ConflictException, ForbiddenException, Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, In } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Department, Permission, PhysicalPerson, ROLE, User, UserDepartment, UserPermission } from '@ged/database';
import type { Role } from '@ged/types';
import type { CreatePhysicalPersonDto } from '../../physical-person/dto/create-physical-person.dto';
import { getAssignableRoles } from '../constants/assignable-roles';

const BCRYPT_ROUNDS = 12;

export interface CreateUserWithProfileData {
  readonly name: string;
  readonly email: string;
  readonly password: string;
  readonly role?: Role;
  readonly actingUserRole: Role;
  readonly pessoaFisica: CreatePhysicalPersonDto;
  readonly permissaoIds?: string[];
  readonly departamentoIds?: string[];
}

@Injectable()
export class CreateUserWithProfileUseCase {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async execute(data: CreateUserWithProfileData): Promise<User> {
    const role = data.role ?? ROLE.VIEWER;
    if (!getAssignableRoles(data.actingUserRole).includes(role)) {
      throw new ForbiddenException('Você não tem permissão para atribuir esta função');
    }

    const passwordHash = await bcrypt.hash(data.password, BCRYPT_ROUNDS);

    return this.dataSource.transaction(async (manager) => {
      const existingByEmail = await manager.findOne(User, {
        where: { email: data.email },
      });
      if (existingByEmail) {
        throw new ConflictException('E-mail já cadastrado');
      }

      const existingByCpf = await manager.findOne(PhysicalPerson, {
        where: { cpf: data.pessoaFisica.cpf },
      });
      if (existingByCpf) {
        throw new ConflictException('CPF já cadastrado');
      }

      const user = manager.create(User, {
        name: data.name,
        email: data.email,
        passwordHash,
        role,
      });
      const savedUser = await manager.save(User, user);

      const pessoaFisica = manager.create(PhysicalPerson, {
        userId: savedUser.id,
        nome: data.pessoaFisica.nome,
        sobrenome: data.pessoaFisica.sobrenome,
        cpf: data.pessoaFisica.cpf,
        dataNascimento: new Date(data.pessoaFisica.dataNascimento),
        sexo: data.pessoaFisica.sexo,
      });
      await manager.save(PhysicalPerson, pessoaFisica);

      if (data.permissaoIds && data.permissaoIds.length > 0) {
        const foundPermissoes = await manager.findBy(Permission, {
          id: In(data.permissaoIds),
        });
        if (foundPermissoes.length !== data.permissaoIds.length) {
          throw new BadRequestException('Uma ou mais permissões não encontradas');
        }
        const usuarioPermissoes = data.permissaoIds.map((permissaoId) =>
          manager.create(UserPermission, { usuarioId: savedUser.id, permissaoId }),
        );
        await manager.save(UserPermission, usuarioPermissoes);
      }

      if (data.departamentoIds && data.departamentoIds.length > 0) {
        const foundDepartamentos = await manager.findBy(Department, {
          id: In(data.departamentoIds),
        });
        if (foundDepartamentos.length !== data.departamentoIds.length) {
          throw new BadRequestException('Um ou mais departamentos não encontrados');
        }
        const usuarioDepartamentos = data.departamentoIds.map((departamentoId) =>
          manager.create(UserDepartment, { usuarioId: savedUser.id, departamentoId }),
        );
        await manager.save(UserDepartment, usuarioDepartamentos);
      }

      return savedUser;
    });
  }
}
