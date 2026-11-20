'use client';

import { useState } from 'react';
import type { AuditLogDto } from '@/types';
import type { AuditLogFilters } from '@/hooks/use-audit-logs';
import { useAuditLogs } from '@/hooks/use-audit-logs';
import { AuditLogDetailSheet } from './audit-log-detail-sheet';

interface Props {
  initialFilters?: AuditLogFilters;
}

export function AuditLogTable({ initialFilters }: Props) {
  const [filters, setFilters] = useState<AuditLogFilters>({
    page: 1,
    limit: 20,
    ...initialFilters,
  });
  const [selectedLog, setSelectedLog] = useState<AuditLogDto | null>(null);

  const { data, isLoading, isError } = useAuditLogs(filters);

  function handleFilter(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setFilters({
      page: 1,
      limit: 20,
      usuarioId: (fd.get('usuarioId') as string) || undefined,
      acao: (fd.get('acao') as string) || undefined,
      entidade: (fd.get('entidade') as string) || undefined,
    });
  }

  function goToPage(page: number) {
    setFilters((prev) => ({ ...prev, page }));
  }

  const totalPages = data ? Math.ceil(data.total / (data.limit ?? 20)) : 1;
  const currentPage = data?.page ?? 1;

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <form
        onSubmit={handleFilter}
        className="flex flex-wrap gap-3 bg-surface border border-border rounded-xl p-4"
      >
        <input
          name="usuarioId"
          placeholder="ID do usuário"
          defaultValue={filters.usuarioId ?? ''}
          className="rounded-lg bg-background border border-border px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring w-52"
        />
        <input
          name="acao"
          placeholder="Ação (ex: CREATE)"
          defaultValue={filters.acao ?? ''}
          className="rounded-lg bg-background border border-border px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring w-44"
        />
        <input
          name="entidade"
          placeholder="Entidade (ex: Document)"
          defaultValue={filters.entidade ?? ''}
          className="rounded-lg bg-background border border-border px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring w-48"
        />
        <button
          type="submit"
          className="px-4 py-2 text-sm bg-primary hover:bg-primary-hover text-primary-foreground rounded-lg transition-colors"
        >
          Filtrar
        </button>
        <button
          type="button"
          onClick={() => setFilters({ page: 1, limit: 20 })}
          className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Limpar
        </button>
      </form>

      {/* Tabela */}
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm min-w-[700px]">
          <thead>
            <tr className="border-b border-border bg-foreground/5">
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Data</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Ação</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Entidade</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">ID Entidade</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Usuário</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">IP</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Dados</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="border-b border-border">
                  {Array.from({ length: 7 }).map((__, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 rounded bg-border animate-pulse" style={{ width: `${60 + (j * 7) % 30}%` }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : isError ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-danger">
                  Erro ao carregar logs.
                </td>
              </tr>
            ) : data?.data.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                  Nenhum log encontrado.
                </td>
              </tr>
            ) : (
              data?.data.map((log) => (
                <tr
                  key={log.id}
                  onClick={() => setSelectedLog(log)}
                  className="cursor-pointer hover:bg-foreground/5 transition-colors"
                >
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString('pt-BR')}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-block text-xs bg-foreground/10 text-foreground rounded px-1.5 py-0.5 font-mono">
                      {log.acao}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-foreground">{log.entidade ?? '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{log.entidadeId ?? '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{log.usuarioId ?? '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{log.ipCliente ?? '—'}</td>
                  <td className="px-4 py-3">
                    {log.dadosAnteriores !== null || log.dadosNovos !== null ? (
                      <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-surface text-warning border border-warning/30">
                        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        diff
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Paginação */}
      {data && data.total > 0 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {data.total} registro{data.total !== 1 ? 's' : ''} · Página {currentPage} de {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage <= 1}
              className="px-3 py-1.5 rounded-lg border border-border hover:border-muted-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Anterior
            </button>
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="px-3 py-1.5 rounded-lg border border-border hover:border-muted-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Próxima
            </button>
          </div>
        </div>
      )}

      <AuditLogDetailSheet log={selectedLog} onClose={() => setSelectedLog(null)} />
    </div>
  );
}
