import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsuarioPermissao } from '@ged/database';
import type { IUsuarioPermissaoRepository } from './interfaces/usuario-permissao-repository.interface';

@Injectable()
export class UsuarioPermissoesRepository implements IUsuarioPermissaoRepository {
  constructor(
    @InjectRepository(UsuarioPermissao)
    private readonly repo: Repository<UsuarioPermissao>,
  ) {}

  findByUsuarioId(usuarioId: string): Promise<UsuarioPermissao[]> {
    return this.repo.find({
      where: { usuarioId },
      relations: ['permissao', 'permissao.modulo'],
      order: { createdAt: 'ASC' },
    });
  }

  findOne(usuarioId: string, permissaoId: string): Promise<UsuarioPermissao | null> {
    return this.repo.findOne({ where: { usuarioId, permissaoId } });
  }

  async assign(usuarioId: string, permissaoId: string): Promise<UsuarioPermissao> {
    const up = this.repo.create({ usuarioId, permissaoId });
    return this.repo.save(up);
  }

  async revoke(usuarioId: string, permissaoId: string): Promise<void> {
    await this.repo.delete({ usuarioId, permissaoId });
  }

  async hasPermissao(usuarioId: string, nomePermissao: string): Promise<boolean> {
    const count = await this.repo
      .createQueryBuilder('up')
      .innerJoin('up.permissao', 'p')
      .where('up.usuario_id = :usuarioId', { usuarioId })
      .andWhere('p.nome = :nome', { nome: nomePermissao })
      .getCount();
    return count > 0;
  }
}
