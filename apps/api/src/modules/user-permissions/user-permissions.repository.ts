import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserPermission } from '@ged/database';
import type { IUserPermissionRepository } from './interfaces/user-permission-repository.interface';

@Injectable()
export class UserPermissionsRepository implements IUserPermissionRepository {
  constructor(
    @InjectRepository(UserPermission)
    private readonly repo: Repository<UserPermission>,
  ) {}

  findByUserId(userId: string): Promise<UserPermission[]> {
    return this.repo.find({
      where: { usuarioId: userId },
      relations: ['permissao', 'permissao.modulo'],
      order: { createdAt: 'ASC' },
    });
  }

  findOne(userId: string, permissionId: string): Promise<UserPermission | null> {
    return this.repo.findOne({ where: { usuarioId: userId, permissaoId: permissionId } });
  }

  async assign(userId: string, permissionId: string): Promise<UserPermission> {
    const up = this.repo.create({ usuarioId: userId, permissaoId: permissionId });
    const saved = await this.repo.save(up);
    return this.repo.findOneOrFail({
      where: { id: saved.id },
      relations: ['permissao'],
    });
  }

  async revoke(userId: string, permissionId: string): Promise<void> {
    await this.repo.delete({ usuarioId: userId, permissaoId: permissionId });
  }

  async hasPermission(userId: string, permissionName: string): Promise<boolean> {
    const count = await this.repo
      .createQueryBuilder('up')
      .innerJoin('up.permissao', 'p')
      .where('up.usuario_id = :userId', { userId })
      .andWhere('p.nome = :nome', { nome: permissionName })
      .getCount();
    return count > 0;
  }
}
