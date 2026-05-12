'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { CompanyPhoneDto } from '@/types';
import {
  useCompanyPhones,
  useCreateCompanyPhone,
  useUpdateCompanyPhone,
  useDeleteCompanyPhone,
} from '@/hooks/use-company-phones';
import { Combobox } from '@/components/ui/combobox';

const schema = z.object({
  tipo: z.enum(['CELULAR', 'RESIDENCIAL', 'COMERCIAL']),
  numero: z.string().min(8, 'Informe o número').max(20),
});

type FormData = z.infer<typeof schema>;
const LABELS: Record<string, string> = { CELULAR: 'Celular', RESIDENCIAL: 'Residencial', COMERCIAL: 'Comercial' };

function PhoneForm({ editing, onDone }: { editing?: CompanyPhoneDto; onDone: () => void }) {
  const create = useCreateCompanyPhone();
  const update = useUpdateCompanyPhone();
  const isPending = create.isPending || update.isPending;

  const { register, handleSubmit, control, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: editing ?? { tipo: 'COMERCIAL', numero: '' },
  });

  function onSubmit(data: FormData) {
    if (editing) update.mutate({ id: editing.id, payload: data }, { onSuccess: onDone });
    else create.mutate(data, { onSuccess: onDone });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/60 p-4 dark:border-slate-700 dark:bg-slate-800/40">
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">Tipo</label>
          <Controller name="tipo" control={control} render={({ field }) => (
            <Combobox value={field.value} onValueChange={field.onChange} placeholder="Tipo…"
              options={[
                { value: 'COMERCIAL', label: 'Comercial' },
                { value: 'CELULAR', label: 'Celular' },
                { value: 'RESIDENCIAL', label: 'Residencial' },
              ]} />
          )} />
        </div>
        <div className="col-span-2">
          <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">Número</label>
          <input {...register('numero')} placeholder="(11) 99999-9999" className={inputCls} />
          {errors.numero && <p className="text-rose-500 text-xs mt-0.5">{errors.numero.message}</p>}
        </div>
      </div>
      <div className="flex gap-2 justify-end pt-1">
        <button type="button" onClick={onDone} disabled={isPending} className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 disabled:opacity-50">Cancelar</button>
        <button type="submit" disabled={isPending} className="px-3 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg disabled:opacity-50">{isPending ? 'Salvando…' : editing ? 'Atualizar' : 'Adicionar'}</button>
      </div>
    </form>
  );
}

export function CompanyPhoneList() {
  const { data: list, isLoading } = useCompanyPhones();
  const del = useDeleteCompanyPhone();
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<CompanyPhoneDto | null>(null);

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Telefones</h3>
        {!showForm && !editTarget && (
          <button onClick={() => setShowForm(true)} className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-500">+ Adicionar</button>
        )}
      </div>
      {showForm && <PhoneForm onDone={() => setShowForm(false)} />}
      {isLoading ? (
        <div className="h-12 rounded-lg bg-slate-200 dark:bg-slate-800 animate-pulse mt-2" />
      ) : list?.length === 0 && !showForm ? (
        <p className="text-slate-500 text-sm">Nenhum telefone cadastrado.</p>
      ) : (
        <ul className="space-y-2 mt-2">
          {list?.map((t) => (
            <li key={t.id}>
              {editTarget?.id === t.id ? (
                <PhoneForm editing={t} onDone={() => setEditTarget(null)} />
              ) : (
                <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800/40 px-3 py-2">
                  <div className="flex items-center gap-3">
                    <span className="inline-block text-xs bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded px-1.5 py-0.5">{LABELS[t.tipo]}</span>
                    <p className="text-sm text-slate-800 dark:text-slate-200">{t.numero}</p>
                  </div>
                  <div className="flex gap-2 ml-3 flex-shrink-0">
                    <button onClick={() => setEditTarget(t)} className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-500">Editar</button>
                    <button onClick={() => del.mutate(t.id)} disabled={del.isPending} className="text-xs text-rose-500 hover:text-rose-400 disabled:opacity-50">Remover</button>
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
