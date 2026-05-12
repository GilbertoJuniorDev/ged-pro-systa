'use client';

import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ROLE } from '@ged/types';
import type { UserDto } from '@/types';
import { useUpdateUser } from '@/hooks/use-users';
import { Combobox } from '@/components/ui/combobox';

const editUserSchema = z.object({
  name: z.string().min(2, 'Nome deve ter ao menos 2 caracteres'),
  role: z.enum([ROLE.MANAGER, ROLE.VIEWER]),
});

type EditUserFormData = z.infer<typeof editUserSchema>;

interface EditUserDialogProps {
  user: UserDto;
  onClose: () => void;
}

export function EditUserDialog({ user, onClose }: EditUserDialogProps) {
  const { mutateAsync, isPending } = useUpdateUser();

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<EditUserFormData>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      name: user.name,
      role: user.role === ROLE.ADMIN ? ROLE.MANAGER : (user.role as 'MANAGER' | 'VIEWER'),
    },
  });

  useEffect(() => {
    reset({
      name: user.name,
      role: user.role === ROLE.ADMIN ? ROLE.MANAGER : (user.role as 'MANAGER' | 'VIEWER'),
    });
  }, [user, reset]);

  const onSubmit = async (data: EditUserFormData) => {
    await mutateAsync({ id: user.id, payload: data });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm overscroll-contain"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-user-dialog-title"
    >
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 id="edit-user-dialog-title" className="text-lg font-semibold text-slate-100">
              Editar Usuário
            </h2>
            <p className="text-sm text-slate-400 mt-0.5">{user.email}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors rounded-lg p-1 hover:bg-slate-800"
            aria-label="Fechar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div>
            <label htmlFor="edit-name" className="block text-sm font-medium text-slate-300 mb-1.5">
              Nome completo
            </label>
            <input
              id="edit-name"
              type="text"
              autoComplete="name"
              className="w-full bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus:border-transparent transition-colors"
              {...register('name')}
            />
            {errors.name && (
              <p className="mt-1.5 text-xs text-rose-400">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="edit-role" className="block text-sm font-medium text-slate-300 mb-1.5">
              Função
            </label>
            <Controller
              name="role"
              control={control}
              render={({ field }) => (
                <Combobox
                  value={field.value}
                  onValueChange={field.onChange}
                  placeholder="Selecionar função…"
                  error={!!errors.role}
                  options={[
                    { value: ROLE.VIEWER, label: 'Visualizador' },
                    { value: ROLE.MANAGER, label: 'Gerente' },
                  ]}
                />
              )}
            />
            {errors.role && (
              <p className="mt-1.5 text-xs text-rose-400">{errors.role.message}</p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-lg py-2.5 text-sm transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium rounded-lg py-2.5 text-sm transition-colors"
            >
              {isPending ? 'Salvando…' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
