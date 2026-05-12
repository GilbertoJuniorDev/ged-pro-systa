export interface CreateAuditLogData {
  readonly usuarioId?: string | null;
  readonly acao: string;
  readonly entidade?: string | null;
  readonly entidadeId?: string | null;
  readonly ipCliente?: string | null;
  readonly userAgent?: string | null;
}
