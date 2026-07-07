'use client';

import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { DocumentSeriesDto } from '@/types';
import { useUpdateDocumentSeries } from '@/hooks/use-document-series';
import { Combobox } from '@/components/ui/combobox';

const schema = z.object({
  prazoCorrenteMeses: z.coerce.number().int().min(0, 'Deve ser um número não-negativo'),
  prazoIntermediarioMeses: z.coerce.number().int().min(0, 'Deve ser um número não-negativo'),
  destinacaoFinal: z.enum(['GUARDA_PERMANENTE', 'ELIMINACAO'], {
    required_error: 'Selecione a destinação final',
  }),
  baseLegal: z.string().max(1000).optional().or(z.literal('')),
});

type FormData = z.infer<typeof schema>;

const DESTINACAO_OPTIONS = [
  { value: 'GUARDA_PERMANENTE', label: 'Guarda Permanente' },
  { value: 'ELIMINACAO', label: 'Eliminação' },
];

interface Props {
  documentSeries: DocumentSeriesDto;
  onClose: () => void;
}

export function EditTemporalidadeDialog({ documentSeries, onClose }: Props) {
  const update = useUpdateDocumentSeries();
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  useEffect(() => {
    reset({
      prazoCorrenteMeses: documentSeries.prazoCorrenteMeses,
      prazoIntermediarioMeses: documentSeries.prazoIntermediarioMeses,
      destinacaoFinal: documentSeries.destinacaoFinal,
      baseLegal: documentSeries.baseLegal ?? '',
    });
  }, [documentSeries, reset]);

  function onSubmit(data: FormData) {
    update.mutate(
      {
        id: documentSeries.id,
        payload: {
          prazoCorrenteMeses: data.prazoCorrenteMeses,
          prazoIntermediarioMeses: data.prazoIntermediarioMeses,
          destinacaoFinal: data.destinacaoFinal,
          baseLegal: data.baseLegal ?? null,
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
        <h2 className="text-base font-semibold text-slate-100 mb-1">Editar Prazos de Guarda</h2>
        <p className="text-sm text-slate-400 mb-5">
          Série {documentSeries.codigo} — {documentSeries.nome}
        </p>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1" htmlFor="edit-prazoCorrenteMeses">
                Prazo Corrente (meses) <span className="text-rose-400">*</span>
              </label>
              <input
                id="edit-prazoCorrenteMeses"
                type="number"
                min={0}
                step={1}
                {...register('prazoCorrenteMeses')}
                className="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {errors.prazoCorrenteMeses && (
                <p className="text-rose-400 text-xs mt-1">{errors.prazoCorrenteMeses.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1" htmlFor="edit-prazoIntermediarioMeses">
                Prazo Intermediário (meses) <span className="text-rose-400">*</span>
              </label>
              <input
                id="edit-prazoIntermediarioMeses"
                type="number"
                min={0}
                step={1}
                {...register('prazoIntermediarioMeses')}
                className="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {errors.prazoIntermediarioMeses && (
                <p className="text-rose-400 text-xs mt-1">{errors.prazoIntermediarioMeses.message}</p>
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1" htmlFor="edit-destinacaoFinal">
              Destinação Final <span className="text-rose-400">*</span>
            </label>
            <Controller
              name="destinacaoFinal"
              control={control}
              render={({ field }) => (
                <Combobox
                  value={field.value ?? ''}
                  onValueChange={field.onChange}
                  options={DESTINACAO_OPTIONS}
                  placeholder="Selecione a destinação final"
                  searchPlaceholder="Buscar…"
                  error={!!errors.destinacaoFinal}
                />
              )}
            />
            {errors.destinacaoFinal && (
              <p className="text-rose-400 text-xs mt-1">{errors.destinacaoFinal.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1" htmlFor="edit-baseLegal">
              Base Legal
            </label>
            <textarea
              id="edit-baseLegal"
              {...register('baseLegal')}
              rows={2}
              placeholder="ex: Lei nº 8.159/1991, art. 9º"
              className="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
            {errors.baseLegal && <p className="text-rose-400 text-xs mt-1">{errors.baseLegal.message}</p>}
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
