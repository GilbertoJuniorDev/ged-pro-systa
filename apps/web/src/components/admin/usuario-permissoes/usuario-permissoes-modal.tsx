'use client';

import { useMemo, useState } from 'react';
import { useUsuarioPermissoes, useAssignPermissao, useRevokePermissao } from '@/hooks/use-usuario-permissoes';
import { usePermissoes } from '@/hooks/use-permissoes';
import { useModulos } from '@/hooks/use-modulos';
import { Checkbox } from '@/components/ui/checkbox';

interface ContentProps {
  userId: string;
}

export function UsuarioPermissoesContent({ userId }: ContentProps) {
  const { data: atribuidas, isLoading } = useUsuarioPermissoes(userId);
  const { data: todasPermissoes } = usePermissoes();
  const { data: modulosRaw } = useModulos();
  const assign = useAssignPermissao(userId);
  const revoke = useRevokePermissao(userId);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const modulos = useMemo(
    () => (modulosRaw ?? []).filter((m) => m.isActive).sort((a, b) => a.ordem - b.ordem),
    [modulosRaw],
  );

  const permissoesPorModulo = useMemo(() => {
    const permissoes = todasPermissoes ?? [];
    const map = new Map<string | null, typeof permissoes>();
    for (const p of permissoes) {
      const key = p.moduloId ?? null;
      const existing = map.get(key) ?? [];
      existing.push(p);
      map.set(key, existing);
    }
    return map;
  }, [todasPermissoes]);

  const atribuidasSet = useMemo(
    () => new Set(atribuidas?.map((up) => up.permissaoId) ?? []),
    [atribuidas],
  );

  function handleToggle(permissaoId: string, isAssigned: boolean) {
    if (pendingId) return;
    setPendingId(permissaoId);
    if (isAssigned) {
      revoke.mutate(permissaoId, { onSettled: () => setPendingId(null) });
    } else {
      assign.mutate(permissaoId, { onSettled: () => setPendingId(null) });
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-3 py-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-10 rounded-lg bg-slate-800 animate-pulse" />
        ))}
      </div>
    );
  }

  const renderPermissoesList = (permissoes: NonNullable<typeof todasPermissoes>) => (
    <div className="px-4 py-3">
      {permissoes.length === 0 ? (
        <p className="text-xs text-slate-500 italic">Nenhuma permissão cadastrada neste módulo.</p>
      ) : (
        <div className="grid grid-cols-1 gap-2">
          {permissoes.map((permissao) => {
            const isAssigned = atribuidasSet.has(permissao.id);
            const isPending = pendingId === permissao.id;
            return (
              <label
                key={permissao.id}
                className={`flex items-start gap-3 cursor-pointer group ${isPending ? 'opacity-50' : ''}`}
              >
                <Checkbox
                  className="mt-0.5"
                  checked={isAssigned}
                  disabled={isPending || !!pendingId}
                  onChange={() => handleToggle(permissao.id, isAssigned)}
                />
                <div className="min-w-0">
                  <span className="text-sm text-slate-300 group-hover:text-slate-100 transition-colors leading-tight block">
                    {permissao.nome}
                  </span>
                  {permissao.descricao && (
                    <span className="text-xs text-slate-500 leading-tight block mt-0.5">
                      {permissao.descricao}
                    </span>
                  )}
                </div>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-3">
      {modulos.map((modulo) => {
        const permissoes = permissoesPorModulo.get(modulo.id) ?? [];
        return (
          <div
            key={modulo.id}
            className="rounded-lg border border-slate-700 bg-slate-800/50 overflow-hidden"
          >
            <div className="flex items-center gap-3 px-4 py-3 bg-slate-800 border-b border-slate-700">
              {modulo.icone && (
                <span className="text-base leading-none">{modulo.icone}</span>
              )}
              <span className="text-sm font-medium text-slate-200">{modulo.nome}</span>
            </div>
            {renderPermissoesList(permissoes)}
          </div>
        );
      })}

      {/* Permissões sem módulo */}
      {(permissoesPorModulo.get(null) ?? []).length > 0 && (
        <div className="rounded-lg border border-slate-700 bg-slate-800/50 overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3 bg-slate-800 border-b border-slate-700">
            <span className="text-sm font-medium text-slate-400 italic">Sem módulo</span>
          </div>
          {renderPermissoesList(permissoesPorModulo.get(null) ?? [])}
        </div>
      )}

      {modulos.length === 0 && (todasPermissoes ?? []).length === 0 && (
        <p className="text-slate-500 text-sm text-center py-6">
          Nenhuma permissão cadastrada.
        </p>
      )}
    </div>
  );
}

interface ModalProps {
  userId: string;
  userName: string;
  onClose: () => void;
}

export function UsuarioPermissoesModal({ userId, userName, onClose }: ModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-slate-900 border border-slate-700 rounded-t-2xl sm:rounded-2xl shadow-xl w-full max-w-lg mx-0 sm:mx-4 p-6 max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base font-semibold text-slate-100">Permissões</h2>
            <p className="text-xs text-slate-400">{userName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-300 transition-colors"
            aria-label="Fechar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="overflow-y-auto flex-1">
          <UsuarioPermissoesContent userId={userId} />
        </div>
      </div>
    </div>
  );
}

