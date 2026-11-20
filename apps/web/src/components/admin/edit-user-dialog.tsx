'use client';

import { useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { ROLE } from '@ged/types';
import type { UserDto } from '@/types';
import { useUpdateUser } from '@/hooks/use-users';
import { useDepartments } from '@/hooks/use-departments';
import { Combobox } from '@/components/ui/combobox';
import { Checkbox } from '@/components/ui/checkbox';
import { ROLE_LABELS } from '@/lib/role-labels';

const editUserSchema = z.object({
  name: z.string().min(2, 'Nome deve ter ao menos 2 caracteres'),
  role: z.enum([ROLE.ADMIN, ROLE.VIEWER]).optional(),
  departamentoIds: z.array(z.string().uuid()),
});

type EditUserFormData = z.infer<typeof editUserSchema>;

interface EditUserDialogProps {
  user: UserDto;
  onClose: () => void;
}

export function EditUserDialog({ user, onClose }: EditUserDialogProps) {
  const { data: session, update } = useSession();
  const { mutateAsync, isPending } = useUpdateUser();
  const { data: departamentosRaw } = useDepartments();
  const router = useRouter();

  const actingRole = session?.user?.role;

  const assignableRoles = useMemo(
    () =>
      actingRole === ROLE.SUPER_ADMIN
        ? [ROLE.ADMIN, ROLE.VIEWER]
        : [ROLE.VIEWER],
    [actingRole],
  );

  const departamentos = useMemo(
    () => (departamentosRaw ?? []).filter((d) => d.isActive).sort((a, b) => a.nome.localeCompare(b.nome)),
    [departamentosRaw],
  );

  const canEditRole = (assignableRoles as readonly string[]).includes(user.role);

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
      role: canEditRole ? (user.role as EditUserFormData['role']) : undefined,
      departamentoIds: [...user.departamentoIds],
    },
  });

  useEffect(() => {
    reset({
      name: user.name,
      role: canEditRole ? (user.role as EditUserFormData['role']) : undefined,
      departamentoIds: [...user.departamentoIds],
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, reset]);

  const onSubmit = async (data: EditUserFormData) => {
    await mutateAsync({
      id: user.id,
      payload: {
        name: data.name,
        ...(canEditRole ? { role: data.role } : {}),
        departamentoIds: data.departamentoIds,
      },
    });

    const currentUserId = (session?.user as { sub?: string } | undefined)?.sub;
    if (currentUserId === user.id) {
      await update();
      router.refresh();
    }

    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm overscroll-contain"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-user-dialog-title"
    >
      <div className="bg-surface-elevated border border-border rounded-2xl shadow-xl w-full max-w-md mx-4 p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 id="edit-user-dialog-title" className="text-lg font-semibold text-foreground">
              Editar Usuário
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">{user.email}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors rounded-lg p-1 hover:bg-foreground/5"
            aria-label="Fechar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div>
            <label htmlFor="edit-name" className="block text-sm font-medium text-foreground mb-1.5">
              Nome completo
            </label>
            <input
              id="edit-name"
              type="text"
              autoComplete="name"
              className="w-full bg-background border border-border text-foreground placeholder:text-muted-foreground rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus:border-transparent transition-colors"
              {...register('name')}
            />
            {errors.name && (
              <p className="mt-1.5 text-xs text-danger">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="edit-role" className="block text-sm font-medium text-foreground mb-1.5">
              Função
            </label>
            {canEditRole ? (
              <Controller
                name="role"
                control={control}
                render={({ field }) => (
                  <Combobox
                    id="edit-role"
                    value={field.value}
                    onValueChange={field.onChange}
                    placeholder="Selecionar função…"
                    error={!!errors.role}
                    options={assignableRoles.map((role) => ({ value: role, label: ROLE_LABELS[role] ?? role }))}
                  />
                )}
              />
            ) : (
              <div className="w-full bg-foreground/5 border border-border text-muted-foreground rounded-lg px-3.5 py-2.5 text-sm">
                {ROLE_LABELS[user.role] ?? user.role}
              </div>
            )}
            {errors.role && (
              <p className="mt-1.5 text-xs text-danger">{errors.role.message}</p>
            )}
          </div>

          <div>
            <p className="block text-sm font-medium text-foreground mb-1.5">
              Departamentos <span className="text-muted-foreground font-normal">(opcional)</span>
            </p>
            <Controller
              control={control}
              name="departamentoIds"
              render={({ field }) => (
                <div className="rounded-lg border border-border bg-foreground/5 overflow-hidden">
                  {departamentos.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic text-center py-4">
                      Nenhum departamento cadastrado.
                    </p>
                  ) : (
                    <div className="px-4 py-3 grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                      {departamentos.map((departamento) => {
                        const isChecked = (field.value ?? []).includes(departamento.id);
                        return (
                          <label
                            key={departamento.id}
                            className="flex items-start gap-3 cursor-pointer group"
                          >
                            <Checkbox
                              className="mt-0.5"
                              checked={isChecked}
                              onChange={(e) => {
                                const current = field.value ?? [];
                                if (e.target.checked) {
                                  field.onChange([...current, departamento.id]);
                                } else {
                                  field.onChange(current.filter((id) => id !== departamento.id));
                                }
                              }}
                            />
                            <span className="text-sm text-foreground group-hover:text-foreground transition-colors leading-tight">
                              {departamento.nome}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-background hover:bg-foreground/5 text-foreground font-medium rounded-lg py-2.5 text-sm transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 bg-primary hover:bg-primary-hover disabled:opacity-60 disabled:cursor-not-allowed text-primary-foreground font-medium rounded-lg py-2.5 text-sm transition-colors"
            >
              {isPending ? 'Salvando…' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
