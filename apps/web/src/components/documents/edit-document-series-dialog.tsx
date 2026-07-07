'use client';

import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { DocumentSeriesDto } from '@/types';
import { useDocumentSeries, useUpdateDocumentSeries } from '@/hooks/use-document-series';
import { Combobox } from '@/components/ui/combobox';
import { Checkbox } from '@/components/ui/checkbox';

// Apenas os campos de classificação são editados aqui — prazoCorrenteMeses,
// prazoIntermediarioMeses, destinacaoFinal e baseLegal pertencem à página de
// Temporalidade (outro agente) e não devem ser tocados neste formulário.
const schema = z.object({
  codigo: z.string().min(1, 'Código é obrigatório').max(20, 'Máximo 20 caracteres'),
  nome: z.string().min(2, 'Mínimo 2 caracteres').max(150, 'Máximo 150 caracteres'),
  descricao: z.string().max(500, 'Máximo 500 caracteres').optional().or(z.literal('')),
  seriePaiId: z.string().uuid().optional().or(z.literal('')),
  isActive: z.boolean().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  documentSeries: DocumentSeriesDto;
  onClose: () => void;
}

export function EditDocumentSeriesDialog({ documentSeries, onClose }: Props) {
  const update = useUpdateDocumentSeries();
  const { data: seriesDoDepartamento } = useDocumentSeries(documentSeries.departamentoId);
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  useEffect(() => {
    reset({
      codigo: documentSeries.codigo,
      nome: documentSeries.nome,
      descricao: documentSeries.descricao ?? '',
      seriePaiId: documentSeries.seriePaiId ?? '',
      isActive: documentSeries.isActive,
    });
  }, [documentSeries, reset]);

  // Opções de série pai restritas ao mesmo departamento e sem a própria série
  // (não pode ser pai de si mesma — o servidor também valida isso).
  const seriePaiOptions = [
    { value: '', label: 'Nenhuma (série raiz)' },
    ...(seriesDoDepartamento ?? [])
      .filter((s) => s.id !== documentSeries.id)
      .map((s) => ({ value: s.id, label: `${s.codigo} — ${s.nome}` })),
  ];

  function onSubmit(data: FormData) {
    update.mutate(
      {
        id: documentSeries.id,
        payload: {
          codigo: data.codigo,
          nome: data.nome,
          descricao: data.descricao === '' ? null : data.descricao,
          seriePaiId: data.seriePaiId === '' ? null : data.seriePaiId,
          isActive: data.isActive,
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
        <h2 className="text-base font-semibold text-slate-100 mb-5">Editar Série de Classificação</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1" htmlFor="edit-codigo">
              Código <span className="text-rose-400">*</span>
            </label>
            <input
              id="edit-codigo"
              {...register('codigo')}
              className="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {errors.codigo && <p className="text-rose-400 text-xs mt-1">{errors.codigo.message}</p>}
          </div>
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
              rows={2}
              className="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
            {errors.descricao && <p className="text-rose-400 text-xs mt-1">{errors.descricao.message}</p>}
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Série Pai</label>
            <Controller
              name="seriePaiId"
              control={control}
              render={({ field }) => (
                <Combobox
                  value={field.value ?? ''}
                  onValueChange={field.onChange}
                  options={seriePaiOptions}
                  placeholder="Nenhuma (série raiz)"
                />
              )}
            />
          </div>
          <div className="flex items-center gap-3">
            <Checkbox id="edit-isActive" {...register('isActive')} />
            <label className="text-sm text-slate-400 cursor-pointer" htmlFor="edit-isActive">
              Série ativa
            </label>
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
