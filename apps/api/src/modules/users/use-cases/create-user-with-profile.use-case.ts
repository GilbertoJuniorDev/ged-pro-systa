import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, In } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Permission, PhysicalPerson, ROLE, User, UserPermission } from '@ged/database';
import type { Role } from '@ged/types';
import type { CreatePhysicalPersonDto } from '../../physical-person/dto/create-physical-person.dto';

const BCRYPT_ROUNDS = 12;

export interface CreateUserWithProfileData {
  readonly name: string;
  readonly email: string;
  readonly password: string;
  readonly role?: Role;
  readonly pessoaFisica: CreatePhysicalPersonDto;
  readonly permissaoIds?: string[];
}

@Injectable()
export class CreateUserWithProfileUseCase {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async execute(data: CreateUserWithProfileData): Promise<User> {
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
        role: data.role ?? ROLE.VIEWER,
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

      return savedUser;
    });
  }
}
