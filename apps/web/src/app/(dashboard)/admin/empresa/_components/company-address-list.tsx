'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { CompanyAddressDto } from '@/types';
import {
  useCompanyAddresses,
  useCreateCompanyAddress,
  useUpdateCompanyAddress,
  useDeleteCompanyAddress,
} from '@/hooks/use-company-addresses';
import { Combobox } from '@/components/ui/combobox';

const schema = z.object({
  tipo: z.enum(['RESIDENCIAL', 'COMERCIAL', 'OUTRO']),
  logradouro: z.string().min(2, 'Obrigatório'),
  numero: z.string().min(1, 'Obrigatório'),
  complemento: z.string().optional(),
  bairro: z.string().min(2, 'Obrigatório'),
  cidade: z.string().min(2, 'Obrigatório'),
  estado: z.string().length(2, 'Use a sigla (ex: SP)'),
  cep: z.string().length(8, 'CEP deve ter 8 dígitos').regex(/^\d+$/, 'Apenas números'),
});

type FormData = z.infer<typeof schema>;

const TIPO_LABELS: Record<string, string> = {
  RESIDENCIAL: 'Residencial',
  COMERCIAL: 'Comercial',
  OUTRO: 'Outro',
};

function AddressForm({ editing, onDone }: { editing?: CompanyAddressDto; onDone: () => void }) {
  const create = useCreateCompanyAddress();
  const update = useUpdateCompanyAddress();
  const isPending = create.isPending || update.isPending;

  const { register, handleSubmit, control, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: editing
      ? { ...editing, complemento: editing.complemento ?? undefined }
      : { tipo: 'COMERCIAL', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '', cep: '' },
  });

  function onSubmit(data: FormData) {
    if (editing) {
      update.mutate({ id: editing.id, payload: data }, { onSuccess: onDone });
    } else {
      create.mutate(data, { onSuccess: onDone });
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/60 p-4 dark:border-slate-700 dark:bg-slate-800/40">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="col-span-2 sm:col-span-1">
          <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">Tipo</label>
          <Controller
            name="tipo"
            control={control}
            render={({ field }) => (
              <Combobox
                value={field.value}
                onValueChange={field.onChange}
                placeholder="Tipo…"
                options={[
                  { value: 'COMERCIAL', label: 'Comercial' },
                  { value: 'RESIDENCIAL', label: 'Residencial' },
                  { value: 'OUTRO', label: 'Outro' },
                ]}
              />
            )}
          />
        </div>
        <div className="col-span-2 sm:col-span-2">
          <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">Logradouro</label>
          <input {...register('logradouro')} className={inputCls} />
          {errors.logradouro && <p className="text-rose-500 text-xs mt-0.5">{errors.logradouro.message}</p>}
        </div>
        <div>
          <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">Número</label>
          <input {...register('numero')} className={inputCls} />
          {errors.numero && <p className="text-rose-500 text-xs mt-0.5">{errors.numero.message}</p>}
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="col-span-2">
          <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">Complemento</label>
          <input {...register('complemento')} className={inputCls} />
        </div>
        <div>
          <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">Bairro</label>
          <input {...register('bairro')} className={inputCls} />
          {errors.bairro && <p className="text-rose-500 text-xs mt-0.5">{errors.bairro.message}</p>}
        </div>
        <div>
          <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">CEP</label>
          <input {...register('cep')} maxLength={8} placeholder="00000000" className={inputCls} />
          {errors.cep && <p className="text-rose-500 text-xs mt-0.5">{errors.cep.message}</p>}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">Cidade</label>
          <input {...register('cidade')} className={inputCls} />
          {errors.cidade && <p className="text-rose-500 text-xs mt-0.5">{errors.cidade.message}</p>}
        </div>
        <div>
          <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">Estado (UF)</label>
          <input {...register('estado')} maxLength={2} placeholder="SP" className={`${inputCls} uppercase`} />
          {errors.estado && <p className="text-rose-500 text-xs mt-0.5">{errors.estado.message}</p>}
        </div>
      </div>
      <div className="flex gap-2 justify-end pt-1">
        <button type="button" onClick={onDone} disabled={isPending} className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 disabled:opacity-50">Cancelar</button>
        <button type="submit" disabled={isPending} className="px-3 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg disabled:opacity-50">
          {isPending ? 'Salvando…' : editing ? 'Atualizar' : 'Adicionar'}
        </button>
      </div>
    </form>
  );
}

export function CompanyAddressList() {
  const { data: list, isLoading } = useCompanyAddresses();
  const del = useDeleteCompanyAddress();
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<CompanyAddressDto | null>(null);

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Endereços</h3>
        {!showForm && !editTarget && (
          <button onClick={() => setShowForm(true)} className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-500">+ Adicionar</button>
        )}
      </div>

      {showForm && <AddressForm onDone={() => setShowForm(false)} />}

      {isLoading ? (
        <div className="space-y-2 mt-2">{Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="h-12 rounded-lg bg-slate-200 dark:bg-slate-800 animate-pulse" />
        ))}</div>
      ) : list?.length === 0 && !showForm ? (
        <p className="text-slate-500 text-sm">Nenhum endereço cadastrado.</p>
      ) : (
        <ul className="space-y-2 mt-2">
          {list?.map((e) => (
            <li key={e.id}>
              {editTarget?.id === e.id ? (
                <AddressForm editing={e} onDone={() => setEditTarget(null)} />
              ) : (
                <div className="flex items-start justify-between rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800/40 px-3 py-2">
                  <div>
                    <span className="inline-block text-xs bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded px-1.5 py-0.5 mb-1">{TIPO_LABELS[e.tipo]}</span>
                    <p className="text-sm text-slate-800 dark:text-slate-200">{e.logradouro}, {e.numero}{e.complemento ? ` — ${e.complemento}` : ''}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{e.bairro} · {e.cidade}/{e.estado} · CEP {e.cep}</p>
                  </div>
                  <div className="flex gap-2 ml-3 flex-shrink-0">
                    <button onClick={() => setEditTarget(e)} className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-500">Editar</button>
                    <button onClick={() => del.mutate(e.id)} disabled={del.isPending} className="text-xs text-rose-500 hover:text-rose-400 disabled:opacity-50">Remover</button>
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

const inputCls =
  'w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100';
