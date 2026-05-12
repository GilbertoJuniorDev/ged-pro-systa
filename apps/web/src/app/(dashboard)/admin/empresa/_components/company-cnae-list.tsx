'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { CompanyCnaeDto } from '@/types';
import {
  useCompanyCnaes,
  useCreateCompanyCnae,
  useUpdateCompanyCnae,
  useDeleteCompanyCnae,
} from '@/hooks/use-company-cnaes';
import { Checkbox } from '@/components/ui/checkbox';

const schema = z.object({
  codigo: z.string().length(7, 'CNAE deve ter 7 dígitos').regex(/^\d+$/, 'Apenas números'),
  descricao: z.string().min(2, 'Obrigatório').max(255),
  principal: z.boolean().optional(),
});

type FormData = z.infer<typeof schema>;

function CnaeForm({ editing, onDone }: { editing?: CompanyCnaeDto; onDone: () => void }) {
  const create = useCreateCompanyCnae();
  const update = useUpdateCompanyCnae();
  const isPending = create.isPending || update.isPending;

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: editing ?? { codigo: '', descricao: '', principal: false },
  });

  function onSubmit(data: FormData) {
    if (editing) update.mutate({ id: editing.id, payload: data }, { onSuccess: onDone });
    else create.mutate(data, { onSuccess: onDone });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/60 p-4 dark:border-slate-700 dark:bg-slate-800/40">
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">Código</label>
          <input {...register('codigo')} maxLength={7} placeholder="6201500" className={inputCls} />
          {errors.codigo && <p className="text-rose-500 text-xs mt-0.5">{errors.codigo.message}</p>}
        </div>
        <div className="col-span-2">
          <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">Descrição</label>
          <input {...register('descricao')} placeholder="Desenvolvimento de programas de computador sob encomenda" className={inputCls} />
          {errors.descricao && <p className="text-rose-500 text-xs mt-0.5">{errors.descricao.message}</p>}
        </div>
      </div>
      <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
        <Checkbox {...register('principal')} />
        CNAE principal (apenas um por empresa)
      </label>
      <div className="flex gap-2 justify-end pt-1">
        <button type="button" onClick={onDone} disabled={isPending} className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 disabled:opacity-50">Cancelar</button>
        <button type="submit" disabled={isPending} className="px-3 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg disabled:opacity-50">{isPending ? 'Salvando…' : editing ? 'Atualizar' : 'Adicionar'}</button>
      </div>
    </form>
  );
}

export function CompanyCnaeList() {
  const { data: list, isLoading } = useCompanyCnaes();
  const del = useDeleteCompanyCnae();
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<CompanyCnaeDto | null>(null);

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">CNAEs</h3>
        {!showForm && !editTarget && (
          <button onClick={() => setShowForm(true)} className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-500">+ Adicionar</button>
        )}
      </div>
      {showForm && <CnaeForm onDone={() => setShowForm(false)} />}
      {isLoading ? (
        <div className="h-12 rounded-lg bg-slate-200 dark:bg-slate-800 animate-pulse mt-2" />
      ) : list?.length === 0 && !showForm ? (
        <p className="text-slate-500 text-sm">Nenhum CNAE cadastrado.</p>
      ) : (
        <ul className="space-y-2 mt-2">
          {list?.map((c) => (
            <li key={c.id}>
              {editTarget?.id === c.id ? (
                <CnaeForm editing={c} onDone={() => setEditTarget(null)} />
              ) : (
                <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800/40 px-3 py-2">
                  <div className="flex items-center gap-3 min-w-0">
                    {c.principal && (
                      <span className="inline-block text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 rounded px-1.5 py-0.5">PRINCIPAL</span>
                    )}
                    <span className="font-mono text-xs text-slate-500 dark:text-slate-400">{c.codigo}</span>
                    <p className="text-sm text-slate-800 dark:text-slate-200 truncate">{c.descricao}</p>
                  </div>
                  <div className="flex gap-2 ml-3 flex-shrink-0">
                    <button onClick={() => setEditTarget(c)} className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-500">Editar</button>
                    <button onClick={() => del.mutate(c.id)} disabled={del.isPending} className="text-xs text-rose-500 hover:text-rose-400 disabled:opacity-50">Remover</button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

const inputCls = 'w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100';
