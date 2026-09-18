'use client';

import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { ArquivoDto } from '@/types';
import { useUpdateArquivo } from '@/hooks/use-arquivos';
import { useDepartments } from '@/hooks/use-departments';
import { MultiCombobox } from '@/components/ui/multi-combobox';

const schema = z.object({
  nome: z.string().min(2, 'Mínimo 2 caracteres').max(150, 'Máximo 150 caracteres'),
  descricao: z.string().max(500).optional().or(z.literal('')),
  predio: z.string().max(150).optional().or(z.literal('')),
  sala: z.string().max(150).optional().or(z.literal('')),
  estante: z.string().max(150).optional().or(z.literal('')),
  prateleira: z.string().max(150).optional().or(z.literal('')),
  caixa: z.string().max(150).optional().or(z.literal('')),
  departamentoIds: z.array(z.string().uuid()).optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  arquivo: ArquivoDto;
  onClose: () => void;
}

export function EditArquivoDialog({ arquivo, onClose }: Props) {
  const update = useUpdateArquivo();
  const { data: departamentos } = useDepartments();
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  useEffect(() => {
    reset({
      nome: arquivo.nome,
      descricao: arquivo.descricao ?? '',
      predio: arquivo.predio ?? '',
      sala: arquivo.sala ?? '',
      estante: arquivo.estante ?? '',
      prateleira: arquivo.prateleira ?? '',
      caixa: arquivo.caixa ?? '',
      departamentoIds: [...arquivo.departamentoIds],
    });
  }, [arquivo, reset]);

  const departamentoNome =
    departamentos?.find((d) => d.id === arquivo.departamentoId)?.nome ?? '—';
  const extraDepartmentOptions = (departamentos ?? []).filter(
    (d) => d.id !== arquivo.departamentoId,
  );

  function onSubmit(data: FormData) {
    update.mutate(
      {
        id: arquivo.id,
        payload: {
          nome: data.nome,
          descricao: data.descricao ?? null,
          predio: data.predio ?? null,
          sala: data.sala ?? null,
          estante: data.estante ?? null,
          prateleira: data.prateleira ?? null,
          caixa: data.caixa ?? null,
          departamentoIds: data.departamentoIds ?? [],
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
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-900">
        <h2 className="mb-1 text-base font-semibold text-slate-950 dark:text-slate-100">
          Editar Arquivo {arquivo.codigo}
        </h2>
        <p className="mb-5 text-xs text-slate-500 dark:text-slate-500">
          Departamento (dono): <span className="text-slate-700 dark:text-slate-400">{departamentoNome}</span>
        </p>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-slate-600 dark:text-slate-400" htmlFor="edit-nome">
              Nome <span className="text-rose-500 dark:text-rose-400">*</span>
            </label>
            <input
              id="edit-nome"
              {...register('nome')}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            />
            {errors.nome && <p className="mt-1 text-xs text-rose-500 dark:text-rose-400">{errors.nome.message}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm text-slate-600 dark:text-slate-400" htmlFor="edit-descricao">
              Descrição
            </label>
            <textarea
              id="edit-descricao"
              {...register('descricao')}
              rows={2}
              className="w-full resize-none rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            />
            {errors.descricao && (
              <p className="mt-1 text-xs text-rose-500 dark:text-rose-400">{errors.descricao.message}</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm text-slate-600 dark:text-slate-400">
              Setores adicionais com acesso
            </label>
            <Controller
              name="departamentoIds"
              control={control}
              render={({ field }) => (
                <MultiCombobox
                  values={field.value ?? []}
                  onValuesChange={field.onChange}
                  options={extraDepartmentOptions.map((d) => ({ value: d.id, label: d.nome }))}
                  placeholder="Nenhum setor adicional"
                />
              )}
            />
          </div>

          <fieldset className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
            <legend className="px-1 text-xs font-medium text-slate-500 dark:text-slate-500">
              Localização física
            </legend>
            <div className="grid grid-cols-2 gap-3">
              {(['predio', 'sala', 'estante', 'prateleira', 'caixa'] as const).map((field) => (
                <div key={field}>
                  <label className="mb-1 block text-xs capitalize text-slate-500 dark:text-slate-500" htmlFor={`edit-${field}`}>
                    {field}
                  </label>
                  <input
                    id={`edit-${field}`}
                    {...register(field)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
              ))}
            </div>
          </fieldset>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={update.isPending}
              className="px-4 py-2 text-sm text-slate-600 transition-colors hover:text-slate-900 disabled:opacity-50 dark:text-slate-300 dark:hover:text-slate-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={update.isPending}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white transition-colors hover:bg-indigo-500 disabled:opacity-50"
            >
              {update.isPending ? 'Salvando…' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
