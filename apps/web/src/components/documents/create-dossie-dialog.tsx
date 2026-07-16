'use client';

import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateDossie } from '@/hooks/use-dossies';
import { useDepartments } from '@/hooks/use-departments';
import { useAuth } from '@/hooks/use-auth';
import { isFullAccessRole } from '@/hooks/use-permissions';
import { Combobox } from '@/components/ui/combobox';

const schema = z.object({
  nome: z.string().min(2, 'Mínimo 2 caracteres').max(150, 'Máximo 150 caracteres'),
  descricao: z.string().max(500, 'Máximo 500 caracteres').optional().or(z.literal('')),
  departamentoId: z.string().uuid('Selecione um departamento'),
});

type FormData = z.infer<typeof schema>;

interface Props {
  onClose: () => void;
}

export function CreateDossieDialog({ onClose }: Props) {
  const create = useCreateDossie();
  const { user } = useAuth();
  const isAdmin = isFullAccessRole(user?.role);
  const { data: departamentos } = useDepartments(isAdmin);
  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

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

  function onSubmit(data: FormData) {
    create.mutate(
      {
        nome: data.nome,
        descricao: data.descricao ?? null,
        departamentoId: data.departamentoId,
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
        <h2 className="text-base font-semibold text-slate-100 mb-5">Novo Dossiê</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1" htmlFor="nome">
              Nome <span className="text-rose-400">*</span>
            </label>
            <input
              id="nome"
              {...register('nome')}
              placeholder="ex: Processo Trabalhista 1234"
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
              rows={2}
              placeholder="Descreva o assunto deste dossiê..."
              className="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
            {errors.descricao && <p className="text-rose-400 text-xs mt-1">{errors.descricao.message}</p>}
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1" htmlFor="departamentoId">
              Departamento <span className="text-rose-400">*</span>
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
              <p className="text-rose-400 text-xs mt-1">{errors.departamentoId.message}</p>
            )}
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
              {create.isPending ? 'Criando…' : 'Criar Dossiê'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
