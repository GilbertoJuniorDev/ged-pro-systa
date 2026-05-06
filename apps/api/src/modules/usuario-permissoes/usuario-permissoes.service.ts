import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { UsuarioPermissao } from '@ged/database';
import type { IUsuarioPermissaoRepository } from './interfaces/usuario-permissao-repository.interface';

export const USUARIO_PERMISSAO_REPOSITORY = 'USUARIO_PERMISSAO_REPOSITORY';

@Injectable()
export class UsuarioPermissoesService {
  constructor(
    @Inject(USUARIO_PERMISSAO_REPOSITORY)
    private readonly repository: IUsuarioPermissaoRepository,
  ) {}

  findByUsuarioId(usuarioId: string): Promise<UsuarioPermissao[]> {
    return this.repository.findByUsuarioId(usuarioId);
  }

  async assign(usuarioId: string, permissaoId: string): Promise<UsuarioPermissao> {
    const existing = await this.repository.findOne(usuarioId, permissaoId);
    if (existing) {
      throw new ConflictException('Usuário já possui esta permissão');
    }
    return this.repository.assign(usuarioId, permissaoId);
  }

  async revoke(usuarioId: string, permissaoId: string): Promise<void> {
    const existing = await this.repository.findOne(usuarioId, permissaoId);
    if (!existing) {
      throw new NotFoundException('Atribuição de permissão não encontrada');
    }
    return this.repository.revoke(usuarioId, permissaoId);
  }

  hasPermissao(usuarioId: string, nomePermissao: string): Promise<boolean> {
    return this.repository.hasPermissao(usuarioId, nomePermissao);
  }
}
