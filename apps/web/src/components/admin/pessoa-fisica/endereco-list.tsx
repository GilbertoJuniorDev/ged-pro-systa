'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { EnderecoDto } from '@/types';
import {
  useEnderecos,
  useCreateEndereco,
  useUpdateEndereco,
  useDeleteEndereco,
  type CreateEnderecoPayload,
} from '@/hooks/use-enderecos';
import { Combobox } from '@/components/ui/combobox';

const schema = z.object({
  tipo: z.enum(['RESIDENCIAL', 'COMERCIAL', 'OUTRO']),
  logradouro: z.string().min(2, 'Obrigatório'),
  numero: z.string().min(1, 'Obrigatório'),
  complemento: z.string().optional(),
  bairro: z.string().min(2, 'Obrigatório'),
  cidade: z.string().min(2, 'Obrigatório'),
  estado: z.string().length(2, 'Use a sigla do estado (ex: SP)'),
  cep: z.string().length(8, 'CEP deve ter 8 dígitos').regex(/^\d+$/, 'Apenas números'),
});

type FormData = z.infer<typeof schema>;

interface EnderecoFormProps {
  userId: string;
  editing?: EnderecoDto;
  onDone: () => void;
}

function EnderecoForm({ userId, editing, onDone }: EnderecoFormProps) {
  const create = useCreateEndereco(userId);
  const update = useUpdateEndereco(userId);
  const isPending = create.isPending || update.isPending;

  const { register, handleSubmit, control, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: editing
      ? { ...editing, complemento: editing.complemento ?? undefined }
      : undefined,
  });

  function onSubmit(data: FormData) {
    if (editing) {
      update.mutate({ id: editing.id, payload: data }, { onSuccess: onDone });
    } else {
      create.mutate(data as CreateEnderecoPayload, { onSuccess: onDone });
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 bg-slate-800/40 rounded-xl p-4 mt-2">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="col-span-2 sm:col-span-1">
          <label className="block text-xs text-slate-400 mb-1">Tipo</label>
          <Controller
            name="tipo"
            control={control}
            render={({ field }) => (
              <Combobox
                value={field.value}
                onValueChange={field.onChange}
                placeholder="Tipo…"
                options={[
                  { value: 'RESIDENCIAL', label: 'Residencial' },
                  { value: 'COMERCIAL', label: 'Comercial' },
                  { value: 'OUTRO', label: 'Outro' },
                ]}
              />
            )}
          />
        </div>
        <div className="col-span-2 sm:col-span-2">
          <label className="block text-xs text-slate-400 mb-1">Logradouro</label>
          <input {...register('logradouro')} className="w-full rounded-lg bg-slate-800 border border-slate-600 px-2 py-1.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          {errors.logradouro && <p className="text-rose-400 text-xs mt-0.5">{errors.logradouro.message}</p>}
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Número</label>
          <input {...register('numero')} className="w-full rounded-lg bg-slate-800 border border-slate-600 px-2 py-1.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          {errors.numero && <p className="text-rose-400 text-xs mt-0.5">{errors.numero.message}</p>}
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="col-span-2">
          <label className="block text-xs text-slate-400 mb-1">Complemento</label>
          <input {...register('complemento')} className="w-full rounded-lg bg-slate-800 border border-slate-600 px-2 py-1.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Bairro</label>
          <input {...register('bairro')} className="w-full rounded-lg bg-slate-800 border border-slate-600 px-2 py-1.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          {errors.bairro && <p className="text-rose-400 text-xs mt-0.5">{errors.bairro.message}</p>}
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">CEP</label>
          <input {...register('cep')} maxLength={8} placeholder="00000000" className="w-full rounded-lg bg-slate-800 border border-slate-600 px-2 py-1.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          {errors.cep && <p className="text-rose-400 text-xs mt-0.5">{errors.cep.message}</p>}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-slate-400 mb-1">Cidade</label>
          <input {...register('cidade')} className="w-full rounded-lg bg-slate-800 border border-slate-600 px-2 py-1.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          {errors.cidade && <p className="text-rose-400 text-xs mt-0.5">{errors.cidade.message}</p>}
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Estado (UF)</label>
          <input {...register('estado')} maxLength={2} placeholder="SP" className="w-full rounded-lg bg-slate-800 border border-slate-600 px-2 py-1.5 text-sm text-slate-100 uppercase placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          {errors.estado && <p className="text-rose-400 text-xs mt-0.5">{errors.estado.message}</p>}
        </div>
      </div>
      <div className="flex gap-2 justify-end pt-1">
        <button type="button" onClick={onDone} disabled={isPending} className="px-3 py-1.5 text-xs text-slate-300 hover:text-slate-100 transition-colors disabled:opacity-50">
          Cancelar
        </button>
        <button type="submit" disabled={isPending} className="px-3 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors disabled:opacity-50">
          {isPending ? 'Salvando…' : editing ? 'Atualizar' : 'Adicionar'}
        </button>
      </div>
    </form>
  );
}

interface Props {
  userId: string;
}

export function EnderecoList({ userId }: Props) {
  const { data: enderecos, isLoading } = useEnderecos(userId);
  const deleteEndereco = useDeleteEndereco(userId);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<EnderecoDto | null>(null);

  const TIPO_LABELS: Record<string, string> = {
    RESIDENCIAL: 'Residencial',
    COMERCIAL: 'Comercial',
    OUTRO: 'Outro',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-slate-300">Endereços</h4>
        {!showForm && !editTarget && (
          <button
            onClick={() => setShowForm(true)}
            className="text-xs text-indigo-400 hover:text-indigo-200 transition-colors"
          >
            + Adicionar
          </button>
        )}
      </div>

      {showForm && (
        <EnderecoForm userId={userId} onDone={() => setShowForm(false)} />
      )}

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-12 rounded-lg bg-slate-800 animate-pulse" />
          ))}
        </div>
      ) : enderecos?.length === 0 && !showForm ? (
        <p className="text-slate-500 text-sm">Nenhum endereço cadastrado.</p>
      ) : (
        <ul className="space-y-2">
          {enderecos?.map((e) => (
            <li key={e.id}>
              {editTarget?.id === e.id ? (
                <EnderecoForm userId={userId} editing={e} onDone={() => setEditTarget(null)} />
              ) : (
                <div className="flex items-start justify-between bg-slate-800/40 rounded-xl px-3 py-2">
                  <div>
                    <span className="inline-block text-xs bg-slate-700 text-slate-300 rounded px-1.5 py-0.5 mb-1">
                      {TIPO_LABELS[e.tipo]}
                    </span>
                    <p className="text-sm text-slate-200">
                      {e.logradouro}, {e.numero}{e.complemento ? ` — ${e.complemento}` : ''}
                    </p>
                    <p className="text-xs text-slate-400">{e.bairro} · {e.cidade}/{e.estado} · CEP {e.cep}</p>
                  </div>
                  <div className="flex gap-2 ml-3 flex-shrink-0">
                    <button onClick={() => setEditTarget(e)} className="text-xs text-indigo-400 hover:text-indigo-200 transition-colors">Editar</button>
                    <button onClick={() => deleteEndereco.mutate(e.id)} disabled={deleteEndereco.isPending} className="text-xs text-rose-400 hover:text-rose-200 transition-colors disabled:opacity-50">Remover</button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
