'use client';

import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateArquivo } from '@/hooks/use-arquivos';
import { useDepartments } from '@/hooks/use-departments';
import { useAuth } from '@/hooks/use-auth';
import { isFullAccessRole } from '@/hooks/use-permissions';
import { Combobox } from '@/components/ui/combobox';
import { MultiCombobox } from '@/components/ui/multi-combobox';

const schema = z.object({
  nome: z.string().min(2, 'Mínimo 2 caracteres').max(150, 'Máximo 150 caracteres'),
  descricao: z.string().max(500, 'Máximo 500 caracteres').optional().or(z.literal('')),
  predio: z.string().max(150).optional().or(z.literal('')),
  sala: z.string().max(150).optional().or(z.literal('')),
  estante: z.string().max(150).optional().or(z.literal('')),
  prateleira: z.string().max(150).optional().or(z.literal('')),
  caixa: z.string().max(150).optional().or(z.literal('')),
  departamentoId: z.string().uuid('Selecione um departamento'),
  departamentoIds: z.array(z.string().uuid()).optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  onClose: () => void;
}

export function CreateArquivoDialog({ onClose }: Props) {
  const create = useCreateArquivo();
  const { user } = useAuth();
  const isAdmin = isFullAccessRole(user?.role);
  const { data: departamentos } = useDepartments(isAdmin);
  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { departamentoIds: [] } });

  useEffect(() => {
    if (user?.selectedDepartmentId) {
      setValue('departamentoId', user.selectedDepartmentId);
    }
  }, [user?.selectedDepartmentId, setValue]);

  const departmentOptions = isAdmin
    ? (departamentos ?? []).map((d) => ({ value: d.id, label: d.nome }))
    : (user?.departamentos ?? [])
        .filter((d) => d.id === user?.selectedDepartmentId)
        .map((d) => ({ value: d.id, label: d.nome }));

  const departamentoIdOwner = watch('departamentoId');
  const extraDepartmentOptions = (departamentos ?? user?.departamentos ?? []).filter(
    (d) => d.id !== departamentoIdOwner,
  );

  function onSubmit(data: FormData) {
    create.mutate(
      {
        nome: data.nome,
        descricao: data.descricao ?? null,
        predio: data.predio ?? null,
        sala: data.sala ?? null,
        estante: data.estante ?? null,
        prateleira: data.prateleira ?? null,
        caixa: data.caixa ?? null,
        departamentoId: data.departamentoId,
        departamentoIds: data.departamentoIds ?? [],
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
          Novo Arquivo
        </h2>
        <p className="mb-5 text-xs text-slate-500 dark:text-slate-500">
          O código (ex.: 2026-001) é gerado automaticamente a partir do departamento e do ano.
        </p>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-slate-600 dark:text-slate-400" htmlFor="nome">
              Nome <span className="text-rose-500 dark:text-rose-400">*</span>
            </label>
            <input
              id="nome"
              {...register('nome')}
              placeholder="ex: Contratos Administrativos"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500"
            />
            {errors.nome && <p className="mt-1 text-xs text-rose-500 dark:text-rose-400">{errors.nome.message}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm text-slate-600 dark:text-slate-400" htmlFor="descricao">
              Descrição
            </label>
            <textarea
              id="descricao"
              {...register('descricao')}
              rows={2}
              placeholder="Descreva o conteúdo deste arquivo…"
              className="w-full resize-none rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500"
            />
            {errors.descricao && (
              <p className="mt-1 text-xs text-rose-500 dark:text-rose-400">{errors.descricao.message}</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm text-slate-600 dark:text-slate-400" htmlFor="departamentoId">
              Departamento (dono) <span className="text-rose-500 dark:text-rose-400">*</span>
            </label>
            <Controller
              name="departamentoId"
              control={control}
              render={({ field }) => (
                <Combobox
                  value={field.value}
                  onValueChange={field.onChange}
                  options={departmentOptions}
                  placeholder="Selecionar departamento…"
                  disabled={!isAdmin}
                  error={!!errors.departamentoId}
                />
              )}
            />
            {errors.departamentoId && (
              <p className="mt-1 text-xs text-rose-500 dark:text-rose-400">{errors.departamentoId.message}</p>
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
                  <label className="mb-1 block text-xs capitalize text-slate-500 dark:text-slate-500" htmlFor={field}>
                    {field}
                  </label>
                  <input
                    id={field}
                    {...register(field)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500"
                  />
                </div>
              ))}
            </div>
          </fieldset>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={create.isPending}
              className="px-4 py-2 text-sm text-slate-600 transition-colors hover:text-slate-900 disabled:opacity-50 dark:text-slate-300 dark:hover:text-slate-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={create.isPending}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white transition-colors hover:bg-indigo-500 disabled:opacity-50"
            >
              {create.isPending ? 'Criando…' : 'Criar Arquivo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
