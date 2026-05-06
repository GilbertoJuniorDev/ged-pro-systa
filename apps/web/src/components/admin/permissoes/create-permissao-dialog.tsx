'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreatePermission } from '@/hooks/use-permission-management';
import { useModules } from '@/hooks/use-modules';
import { Combobox } from '@/components/ui/combobox';

const schema = z.object({
  nome: z.string().min(3, 'Mínimo 3 caracteres').max(100, 'Máximo 100 caracteres'),
  descricao: z.string().max(255, 'Máximo 255 caracteres').optional().or(z.literal('')),
  moduloId: z.string().uuid().nullable().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  onClose: () => void;
}

export function CreatePermissaoDialog({ onClose }: Props) {
  const create = useCreatePermission();
  const { data: modulos } = useModules();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  function onSubmit(data: FormData) {
    create.mutate(
      {
        nome: data.nome,
        descricao: data.descricao ?? undefined,
        moduloId: data.moduloId ?? null,
      },
      { onSuccess: onClose },
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
        <h2 className="text-base font-semibold text-slate-100 mb-5">Nova Permissão</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1" htmlFor="nome">
              Nome <span className="text-rose-400">*</span>
            </label>
            <input
              id="nome"
              {...register('nome')}
              placeholder="ex: documentos.criar"
              className="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {errors.nome && <p className="text-rose-400 text-xs mt-1">{errors.nome.message}</p>}
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1" htmlFor="descricao">
              Descrição
            </label>
            <textarea
              id="descricao"
              {...register('descricao')}
              rows={3}
              placeholder="Descreva o que esta permissão permite..."
              className="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
            {errors.descricao && <p className="text-rose-400 text-xs mt-1">{errors.descricao.message}</p>}
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1" htmlFor="moduloId">
              Módulo
            </label>
            <Controller
              name="moduloId"
              control={control}
              render={({ field }) => (
                <Combobox
                  value={field.value ?? ''}
                  onValueChange={(v) => field.onChange(v === '' ? null : v)}
                  placeholder="— Sem módulo —"
                  searchPlaceholder="Buscar módulo…"
                  error={!!errors.moduloId}
                  options={[
                    { value: '', label: '— Sem módulo —' },
                    ...(modulos ?? []).map((m) => ({
                      value: m.id,
                      label: `${m.nome} (${m.slug})`,
                    })),
                  ]}
                />
              )}
            />
            {errors.moduloId && <p className="text-rose-400 text-xs mt-1">{errors.moduloId.message}</p>}
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={create.isPending}
              className="px-4 py-2 text-sm text-slate-300 hover:text-slate-100 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={create.isPending}
              className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {create.isPending ? 'Criando…' : 'Criar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
