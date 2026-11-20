'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { TelefoneDto } from '@/types';
import {
  useTelefones,
  useCreateTelefone,
  useUpdateTelefone,
  useDeleteTelefone,
  type CreateTelefonePayload,
} from '@/hooks/use-telefones';

const schema = z.object({
  tipo: z.enum(['CELULAR', 'RESIDENCIAL', 'COMERCIAL']),
  numero: z.string().min(8, 'Mínimo 8 dígitos').max(20, 'Máximo 20 caracteres'),
});

type FormData = z.infer<typeof schema>;

const TIPO_LABELS: Record<string, string> = {
  CELULAR: 'Celular',
  RESIDENCIAL: 'Residencial',
  COMERCIAL: 'Comercial',
};

interface TelefoneFormProps {
  userId: string;
  editing?: TelefoneDto;
  onDone: () => void;
}

function TelefoneForm({ userId, editing, onDone }: TelefoneFormProps) {
  const create = useCreateTelefone(userId);
  const update = useUpdateTelefone(userId);
  const isPending = create.isPending || update.isPending;

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: editing ? { tipo: editing.tipo, numero: editing.numero } : undefined,
  });

  function onSubmit(data: FormData) {
    if (editing) {
      update.mutate({ id: editing.id, payload: data }, { onSuccess: onDone });
    } else {
      create.mutate(data as CreateTelefonePayload, { onSuccess: onDone });
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex gap-2 items-end bg-foreground/5 rounded-xl p-3 mt-2">
      <div>
        <label className="block text-xs text-muted-foreground mb-1">Tipo</label>
        <select {...register('tipo')} className="rounded-lg bg-background border border-border px-2 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
          <option value="CELULAR">Celular</option>
          <option value="RESIDENCIAL">Residencial</option>
          <option value="COMERCIAL">Comercial</option>
        </select>
      </div>
      <div className="flex-1">
        <label className="block text-xs text-muted-foreground mb-1">Número</label>
        <input
          {...register('numero')}
          placeholder="(11) 99999-9999"
          className="w-full rounded-lg bg-background border border-border px-2 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        {errors.numero && <p className="text-danger text-xs mt-0.5">{errors.numero.message}</p>}
      </div>
      <button type="submit" disabled={isPending} className="px-3 py-1.5 text-xs bg-primary hover:bg-primary-hover text-primary-foreground rounded-lg transition-colors disabled:opacity-50">
        {isPending ? '…' : editing ? 'Atualizar' : 'Adicionar'}
      </button>
      <button type="button" onClick={onDone} disabled={isPending} className="px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50">
        ✕
      </button>
    </form>
  );
}

interface Props {
  userId: string;
}

export function TelefoneList({ userId }: Props) {
  const { data: telefones, isLoading } = useTelefones(userId);
  const deleteTelefone = useDeleteTelefone(userId);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<TelefoneDto | null>(null);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-foreground">Telefones</h4>
        {!showForm && !editTarget && (
          <button onClick={() => setShowForm(true)} className="text-xs text-primary hover:text-primary-hover transition-colors">
            + Adicionar
          </button>
        )}
      </div>

      {showForm && (
        <TelefoneForm userId={userId} onDone={() => setShowForm(false)} />
      )}

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-10 rounded-lg bg-border animate-pulse" />
          ))}
        </div>
      ) : telefones?.length === 0 && !showForm ? (
        <p className="text-muted-foreground text-sm">Nenhum telefone cadastrado.</p>
      ) : (
        <ul className="space-y-2">
          {telefones?.map((t) => (
            <li key={t.id}>
              {editTarget?.id === t.id ? (
                <TelefoneForm userId={userId} editing={t} onDone={() => setEditTarget(null)} />
              ) : (
                <div className="flex items-center justify-between bg-foreground/5 rounded-xl px-3 py-2">
                  <div className="flex items-center gap-3">
                    <span className="inline-block text-xs bg-foreground/10 text-foreground rounded px-1.5 py-0.5">
                      {TIPO_LABELS[t.tipo]}
                    </span>
                    <span className="text-sm text-foreground">{t.numero}</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setEditTarget(t)} className="text-xs text-primary hover:text-primary-hover transition-colors">Editar</button>
                    <button onClick={() => deleteTelefone.mutate(t.id)} disabled={deleteTelefone.isPending} className="text-xs text-danger transition-colors disabled:opacity-50">Remover</button>
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
