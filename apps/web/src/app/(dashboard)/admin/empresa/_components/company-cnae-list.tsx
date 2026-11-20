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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 rounded-xl border border-border bg-foreground/5 p-4">
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Código</label>
          <input {...register('codigo')} maxLength={7} placeholder="6201500" className={inputCls} />
          {errors.codigo && <p className="text-danger text-xs mt-0.5">{errors.codigo.message}</p>}
        </div>
        <div className="col-span-2">
          <label className="block text-xs text-muted-foreground mb-1">Descrição</label>
          <input {...register('descricao')} placeholder="Desenvolvimento de programas de computador sob encomenda" className={inputCls} />
          {errors.descricao && <p className="text-danger text-xs mt-0.5">{errors.descricao.message}</p>}
        </div>
      </div>
      <label className="flex items-center gap-2 text-xs text-muted-foreground">
        <Checkbox {...register('principal')} />
        CNAE principal (apenas um por empresa)
      </label>
      <div className="flex gap-2 justify-end pt-1">
        <button type="button" onClick={onDone} disabled={isPending} className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground disabled:opacity-50">Cancelar</button>
        <button type="submit" disabled={isPending} className="px-3 py-1.5 text-xs bg-primary hover:bg-primary-hover text-primary-foreground rounded-lg disabled:opacity-50">{isPending ? 'Salvando…' : editing ? 'Atualizar' : 'Adicionar'}</button>
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
        <h3 className="text-base font-semibold text-foreground">CNAEs</h3>
        {!showForm && !editTarget && (
          <button onClick={() => setShowForm(true)} className="text-xs text-primary hover:text-primary-hover">+ Adicionar</button>
        )}
      </div>
      {showForm && <CnaeForm onDone={() => setShowForm(false)} />}
      {isLoading ? (
        <div className="h-12 rounded-lg bg-foreground/10 animate-pulse mt-2" />
      ) : list?.length === 0 && !showForm ? (
        <p className="text-muted-foreground text-sm">Nenhum CNAE cadastrado.</p>
      ) : (
        <ul className="space-y-2 mt-2">
          {list?.map((c) => (
            <li key={c.id}>
              {editTarget?.id === c.id ? (
                <CnaeForm editing={c} onDone={() => setEditTarget(null)} />
              ) : (
                <div className="flex items-center justify-between rounded-xl border border-border bg-surface px-3 py-2">
                  <div className="flex items-center gap-3 min-w-0">
                    {c.principal && (
                      <span className="inline-block text-[10px] font-semibold ring-1 ring-inset ring-success/40 text-success rounded px-1.5 py-0.5">PRINCIPAL</span>
                    )}
                    <span className="font-mono text-xs text-muted-foreground">{c.codigo}</span>
                    <p className="text-sm text-foreground truncate">{c.descricao}</p>
                  </div>
                  <div className="flex gap-2 ml-3 flex-shrink-0">
                    <button onClick={() => setEditTarget(c)} className="text-xs text-primary hover:text-primary-hover">Editar</button>
                    <button onClick={() => del.mutate(c.id)} disabled={del.isPending} className="text-xs text-danger disabled:opacity-50">Remover</button>
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

const inputCls = 'w-full rounded-lg border border-border bg-surface px-2 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring';
