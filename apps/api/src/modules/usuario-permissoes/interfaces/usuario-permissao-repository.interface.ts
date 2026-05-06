import type { UsuarioPermissao } from '@ged/database';

export interface IUsuarioPermissaoRepository {
  findByUsuarioId(usuarioId: string): Promise<UsuarioPermissao[]>;
  findOne(usuarioId: string, permissaoId: string): Promise<UsuarioPermissao | null>;
  assign(usuarioId: string, permissaoId: string): Promise<UsuarioPermissao>;
  revoke(usuarioId: string, permissaoId: string): Promise<void>;
  hasPermissao(usuarioId: string, nomePermissao: string): Promise<boolean>;
}
