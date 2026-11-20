'use client';

import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { PermissionDto } from '@/types';
import { useUpdatePermission } from '@/hooks/use-permission-management';
import { useModules } from '@/hooks/use-modules';
import { Combobox } from '@/components/ui/combobox';

const schema = z.object({
  nome: z.string().min(3, 'Mínimo 3 caracteres').max(100, 'Máximo 100 caracteres'),
  descricao: z.string().max(255, 'Máximo 255 caracteres').optional().or(z.literal('')),
  moduloId: z.string().uuid().nullable().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  permissao: PermissionDto;
  onClose: () => void;
}

export function EditPermissaoDialog({ permissao, onClose }: Props) {
  const update = useUpdatePermission();
  const { data: modulos } = useModules();
  const {
    register,
    handleSubmit,
    reset,
    control,
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-surface-elevated border border-border rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
        <h2 className="text-base font-semibold text-foreground mb-5">Editar Permissão</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm text-muted-foreground mb-1" htmlFor="edit-nome">
              Nome <span className="text-danger">*</span>
            </label>
            <input
              id="edit-nome"
              {...register('nome')}
              className="w-full rounded-lg bg-background border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            {errors.nome && <p className="text-danger text-xs mt-1">{errors.nome.message}</p>}
          </div>
          <div>
            <label className="block text-sm text-muted-foreground mb-1" htmlFor="edit-descricao">
              Descrição
            </label>
            <textarea
              id="edit-descricao"
              {...register('descricao')}
              rows={3}
              className="w-full rounded-lg bg-background border border-border px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
            {errors.descricao && <p className="text-danger text-xs mt-1">{errors.descricao.message}</p>}
          </div>
          <div>
            <label className="block text-sm text-muted-foreground mb-1" htmlFor="edit-moduloId">
              Módulo
            </label>
            <Controller
              name="moduloId"
              control={control}
              render={({ field }) => (
                <Combobox
                  value={field.value ?? ''}
                  onValueChange={(v) => field.onChange(v === '' ? null : v)}
                  placeholder="— Sem módulo —"
                  searchPlaceholder="Buscar módulo…"
                  error={!!errors.moduloId}
                  options={[
                    { value: '', label: '— Sem módulo —' },
                    ...(modulos ?? []).map((m) => ({
                      value: m.id,
                      label: `${m.nome} (${m.slug})`,
                    })),
                  ]}
                />
              )}
            />
            {errors.moduloId && <p className="text-danger text-xs mt-1">{errors.moduloId.message}</p>}
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={update.isPending}
              className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={update.isPending}
              className="px-4 py-2 text-sm bg-primary hover:bg-primary-hover text-primary-foreground rounded-lg transition-colors disabled:opacity-50"
            >
              {update.isPending ? 'Salvando…' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
