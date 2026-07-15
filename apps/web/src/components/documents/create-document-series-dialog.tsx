'use client';

import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { DESTINACAO_FINAL } from '@/types';
import { useCreateDocumentSeries, useDocumentSeries } from '@/hooks/use-document-series';
import { useDepartments } from '@/hooks/use-departments';
import { Combobox } from '@/components/ui/combobox';

const schema = z.object({
  codigo: z.string().min(1, 'Código é obrigatório').max(20, 'Máximo 20 caracteres'),
  nome: z.string().min(2, 'Mínimo 2 caracteres').max(150, 'Máximo 150 caracteres'),
  descricao: z.string().max(500, 'Máximo 500 caracteres').optional().or(z.literal('')),
  departamentoId: z.string().uuid('Selecione um departamento'),
  seriePaiId: z.string().uuid().optional().or(z.literal('')),
  prazoCorrenteMeses: z.coerce
    .number({ invalid_type_error: 'Informe um número' })
    .int('Deve ser um número inteiro')
    .min(0, 'Não pode ser negativo'),
  prazoIntermediarioMeses: z.coerce
    .number({ invalid_type_error: 'Informe um número' })
    .int('Deve ser um número inteiro')
    .min(0, 'Não pode ser negativo'),
  destinacaoFinal: z.enum([DESTINACAO_FINAL.GUARDA_PERMANENTE, DESTINACAO_FINAL.ELIMINACAO], {
    required_error: 'Selecione a destinação final',
  }),
  baseLegal: z.string().max(1000, 'Máximo 1000 caracteres').optional().or(z.literal('')),
});

type FormData = z.infer<typeof schema>;

const DESTINACAO_OPTIONS = [
  { value: DESTINACAO_FINAL.GUARDA_PERMANENTE, label: 'Guarda Permanente' },
  { value: DESTINACAO_FINAL.ELIMINACAO, label: 'Eliminação' },
];

interface Props {
  onClose: () => void;
}

export function CreateDocumentSeriesDialog({ onClose }: Props) {
  const create = useCreateDocumentSeries();
  const { data: departamentos } = useDepartments();
  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const watchedDepartamentoId = watch('departamentoId');
  const { data: seriesDoDepartamento } = useDocumentSeries(watchedDepartamentoId ?? undefined);

  // Ao trocar o departamento, a série pai selecionada (se houver) deixa de ser
  // válida — reseta para evitar submeter um seriePaiId de outro departamento.
  useEffect(() => {
    setValue('seriePaiId', '');
  }, [watchedDepartamentoId, setValue]);

  const departamentoOptions = (departamentos ?? []).map((d) => ({ value: d.id, label: d.nome }));

  const seriePaiOptions = [
    { value: '', label: 'Nenhuma (série raiz)' },
    ...(watchedDepartamentoId
      ? (seriesDoDepartamento ?? [])
          .filter((s) => s.departamentoId === watchedDepartamentoId)
          .map((s) => ({ value: s.id, label: `${s.codigo} — ${s.nome}` }))
      : []),
  ];

  function onSubmit(data: FormData) {
    create.mutate(
      {
        codigo: data.codigo,
        nome: data.nome,
        descricao: data.descricao === '' ? undefined : data.descricao,
        departamentoId: data.departamentoId,
        seriePaiId: data.seriePaiId === '' ? undefined : data.seriePaiId,
        prazoCorrenteMeses: data.prazoCorrenteMeses,
        prazoIntermediarioMeses: data.prazoIntermediarioMeses,
        destinacaoFinal: data.destinacaoFinal,
        baseLegal: data.baseLegal === '' ? undefined : data.baseLegal,
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
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-xl w-full max-w-lg mx-4 p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-base font-semibold text-slate-100 mb-5">Nova Série de Classificação</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1" htmlFor="codigo">
                Código <span className="text-rose-400">*</span>
              </label>
              <input
                id="codigo"
                {...register('codigo')}
                placeholder="ex: 100"
                className="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {errors.codigo && <p className="text-rose-400 text-xs mt-1">{errors.codigo.message}</p>}
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1" htmlFor="nome">
                Nome <span className="text-rose-400">*</span>
              </label>
              <input
                id="nome"
                {...register('nome')}
                placeholder="ex: Contratos Administrativos"
                className="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {errors.nome && <p className="text-rose-400 text-xs mt-1">{errors.nome.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1" htmlFor="descricao">
              Descrição
            </label>
            <textarea
              id="descricao"
              {...register('descricao')}
              rows={2}
              placeholder="Descreva o que esta série classifica..."
              className="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
            {errors.descricao && <p className="text-rose-400 text-xs mt-1">{errors.descricao.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">
                Departamento <span className="text-rose-400">*</span>
              </label>
              <Controller
                name="departamentoId"
                control={control}
                render={({ field }) => (
                  <Combobox
                    value={field.value}
                    onValueChange={field.onChange}
                    options={departamentoOptions}
                    placeholder="Selecione o departamento"
                    error={!!errors.departamentoId}
                  />
                )}
              />
              {errors.departamentoId && (
                <p className="text-rose-400 text-xs mt-1">{errors.departamentoId.message}</p>
              )}
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
                    disabled={!watchedDepartamentoId}
                  />
                )}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1" htmlFor="prazoCorrenteMeses">
                Prazo corrente (meses) <span className="text-rose-400">*</span>
              </label>
              <input
                id="prazoCorrenteMeses"
                type="number"
                min={0}
                {...register('prazoCorrenteMeses')}
                placeholder="0"
                className="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {errors.prazoCorrenteMeses && (
                <p className="text-rose-400 text-xs mt-1">{errors.prazoCorrenteMeses.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1" htmlFor="prazoIntermediarioMeses">
                Prazo intermediário (meses) <span className="text-rose-400">*</span>
              </label>
              <input
                id="prazoIntermediarioMeses"
                type="number"
                min={0}
                {...register('prazoIntermediarioMeses')}
                placeholder="0"
                className="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {errors.prazoIntermediarioMeses && (
                <p className="text-rose-400 text-xs mt-1">{errors.prazoIntermediarioMeses.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">
              Destinação Final <span className="text-rose-400">*</span>
            </label>
            <Controller
              name="destinacaoFinal"
              control={control}
              render={({ field }) => (
                <Combobox
                  value={field.value}
                  onValueChange={field.onChange}
                  options={DESTINACAO_OPTIONS}
                  placeholder="Selecione a destinação final"
                  error={!!errors.destinacaoFinal}
                />
              )}
            />
            {errors.destinacaoFinal && (
              <p className="text-rose-400 text-xs mt-1">{errors.destinacaoFinal.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1" htmlFor="baseLegal">
              Base Legal
            </label>
            <textarea
              id="baseLegal"
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
              {create.isPending ? 'Criando…' : 'Criar Série'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
