'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { PermissaoDto } from '@/types';
import { useUpdatePermissao } from '@/hooks/use-permissoes';
import { useModulos } from '@/hooks/use-modulos';

const schema = z.object({
  nome: z.string().min(3, 'Mínimo 3 caracteres').max(100, 'Máximo 100 caracteres'),
  descricao: z.string().max(255, 'Máximo 255 caracteres').optional().or(z.literal('')),
  moduloId: z.string().uuid().nullable().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  permissao: PermissaoDto;
  onClose: () => void;
}

export function EditPermissaoDialog({ permissao, onClose }: Props) {
  const update = useUpdatePermissao();
  const { data: modulos } = useModulos();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  useEffect(() => {
    reset({
      nome: permissao.nome,
      descricao: permissao.descricao ?? '',
      moduloId: permissao.moduloId ?? '',
    });
  }, [permissao, reset]);

  function onSubmit(data: FormData) {
    update.mutate(
      {
        id: permissao.id,
        payload: {
          nome: data.nome,
          descricao: data.descricao ?? undefined,
          moduloId: data.moduloId ?? null,
        },
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
        <h2 className="text-base font-semibold text-slate-100 mb-5">Editar Permissão</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1" htmlFor="edit-nome">
              Nome <span className="text-rose-400">*</span>
            </label>
            <input
              id="edit-nome"
              {...register('nome')}
              className="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {errors.nome && <p className="text-rose-400 text-xs mt-1">{errors.nome.message}</p>}
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1" htmlFor="edit-descricao">
              Descrição
            </label>
            <textarea
              id="edit-descricao"
              {...register('descricao')}
              rows={3}
              className="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
            {errors.descricao && <p className="text-rose-400 text-xs mt-1">{errors.descricao.message}</p>}
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1" htmlFor="edit-moduloId">
              Módulo
            </label>
            <select
              id="edit-moduloId"
              {...register('moduloId')}
              className="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">— Sem módulo —</option>
              {modulos?.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nome} ({m.slug})
                </option>
              ))}
            </select>
            {errors.moduloId && <p className="text-rose-400 text-xs mt-1">{errors.moduloId.message}</p>}
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={update.isPending}
              className="px-4 py-2 text-sm text-slate-300 hover:text-slate-100 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={update.isPending}
              className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {update.isPending ? 'Salvando…' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
