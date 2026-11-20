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
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-surface-elevated p-6 shadow-xl">
        <h2 className="mb-1 text-base font-semibold text-foreground">
          Novo Arquivo
        </h2>
        <p className="mb-5 text-xs text-muted-foreground">
          O código (ex.: 2026-001) é gerado automaticamente a partir do departamento e do ano.
        </p>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-muted-foreground" htmlFor="nome">
              Nome <span className="text-danger">*</span>
            </label>
            <input
              id="nome"
              {...register('nome')}
              placeholder="ex: Contratos Administrativos"
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            {errors.nome && <p className="mt-1 text-xs text-danger">{errors.nome.message}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm text-muted-foreground" htmlFor="descricao">
              Descrição
            </label>
            <textarea
              id="descricao"
              {...register('descricao')}
              rows={2}
              placeholder="Descreva o conteúdo deste arquivo…"
              className="w-full resize-none rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            {errors.descricao && (
              <p className="mt-1 text-xs text-danger">{errors.descricao.message}</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm text-muted-foreground" htmlFor="departamentoId">
              Departamento (dono) <span className="text-danger">*</span>
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
              <p className="mt-1 text-xs text-danger">{errors.departamentoId.message}</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm text-muted-foreground">
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

          <fieldset className="rounded-lg border border-border p-3">
            <legend className="px-1 text-xs font-medium text-muted-foreground">
              Localização física
            </legend>
            <div className="grid grid-cols-2 gap-3">
              {(['predio', 'sala', 'estante', 'prateleira', 'caixa'] as const).map((field) => (
                <div key={field}>
                  <label className="mb-1 block text-xs capitalize text-muted-foreground" htmlFor={field}>
                    {field}
                  </label>
                  <input
                    id={field}
                    {...register(field)}
                    className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
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
              className="px-4 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={create.isPending}
              className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-50"
            >
              {create.isPending ? 'Criando…' : 'Criar Arquivo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
