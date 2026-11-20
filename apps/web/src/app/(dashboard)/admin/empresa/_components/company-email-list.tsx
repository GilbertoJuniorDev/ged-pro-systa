'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { CompanyEmailDto } from '@/types';
import {
  useCompanyEmails,
  useCreateCompanyEmail,
  useUpdateCompanyEmail,
  useDeleteCompanyEmail,
} from '@/hooks/use-company-emails';
import { Combobox } from '@/components/ui/combobox';

const schema = z.object({
  tipo: z.enum(['PRINCIPAL', 'FINANCEIRO', 'COMERCIAL', 'OUTRO']),
  endereco: z.string().email('E-mail inválido').max(255),
});

type FormData = z.infer<typeof schema>;
const LABELS: Record<string, string> = { PRINCIPAL: 'Principal', FINANCEIRO: 'Financeiro', COMERCIAL: 'Comercial', OUTRO: 'Outro' };

function EmailForm({ editing, onDone }: { editing?: CompanyEmailDto; onDone: () => void }) {
  const create = useCreateCompanyEmail();
  const update = useUpdateCompanyEmail();
  const isPending = create.isPending || update.isPending;

  const { register, handleSubmit, control, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: editing ?? { tipo: 'PRINCIPAL', endereco: '' },
  });

  function onSubmit(data: FormData) {
    if (editing) update.mutate({ id: editing.id, payload: data }, { onSuccess: onDone });
    else create.mutate(data, { onSuccess: onDone });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 rounded-xl border border-border bg-foreground/5 p-4">
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Tipo</label>
          <Controller name="tipo" control={control} render={({ field }) => (
            <Combobox value={field.value} onValueChange={field.onChange} placeholder="Tipo…"
              options={[
                { value: 'PRINCIPAL', label: 'Principal' },
                { value: 'FINANCEIRO', label: 'Financeiro' },
                { value: 'COMERCIAL', label: 'Comercial' },
                { value: 'OUTRO', label: 'Outro' },
              ]} />
          )} />
        </div>
        <div className="col-span-2">
          <label className="block text-xs text-muted-foreground mb-1">E-mail</label>
          <input type="email" {...register('endereco')} placeholder="contato@empresa.com" className={inputCls} />
          {errors.endereco && <p className="text-danger text-xs mt-0.5">{errors.endereco.message}</p>}
        </div>
      </div>
      <div className="flex gap-2 justify-end pt-1">
        <button type="button" onClick={onDone} disabled={isPending} className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground disabled:opacity-50">Cancelar</button>
        <button type="submit" disabled={isPending} className="px-3 py-1.5 text-xs bg-primary hover:bg-primary-hover text-primary-foreground rounded-lg disabled:opacity-50">{isPending ? 'Salvando…' : editing ? 'Atualizar' : 'Adicionar'}</button>
      </div>
    </form>
  );
}

export function CompanyEmailList() {
  const { data: list, isLoading } = useCompanyEmails();
  const del = useDeleteCompanyEmail();
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<CompanyEmailDto | null>(null);

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-semibold text-foreground">E-mails</h3>
        {!showForm && !editTarget && (
          <button onClick={() => setShowForm(true)} className="text-xs text-primary hover:text-primary-hover">+ Adicionar</button>
        )}
      </div>
      {showForm && <EmailForm onDone={() => setShowForm(false)} />}
      {isLoading ? (
        <div className="h-12 rounded-lg bg-foreground/10 animate-pulse mt-2" />
      ) : list?.length === 0 && !showForm ? (
        <p className="text-muted-foreground text-sm">Nenhum e-mail cadastrado.</p>
      ) : (
        <ul className="space-y-2 mt-2">
          {list?.map((e) => (
            <li key={e.id}>
              {editTarget?.id === e.id ? (
                <EmailForm editing={e} onDone={() => setEditTarget(null)} />
              ) : (
                <div className="flex items-center justify-between rounded-xl border border-border bg-surface px-3 py-2">
                  <div className="flex items-center gap-3">
                    <span className="inline-block text-xs bg-foreground/5 text-muted-foreground rounded px-1.5 py-0.5">{LABELS[e.tipo]}</span>
                    <p className="text-sm text-foreground">{e.endereco}</p>
                  </div>
                  <div className="flex gap-2 ml-3 flex-shrink-0">
                    <button onClick={() => setEditTarget(e)} className="text-xs text-primary hover:text-primary-hover">Editar</button>
                    <button onClick={() => del.mutate(e.id)} disabled={del.isPending} className="text-xs text-danger disabled:opacity-50">Remover</button>
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
