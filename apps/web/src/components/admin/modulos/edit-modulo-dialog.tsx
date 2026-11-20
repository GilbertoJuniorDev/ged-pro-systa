'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { ModuleDto } from '@/types';
import { useUpdateModule } from '@/hooks/use-modules';
import { Checkbox } from '@/components/ui/checkbox';

const schema = z.object({
  nome: z.string().min(2, 'Mínimo 2 caracteres').max(100, 'Máximo 100 caracteres'),
  slug: z
    .string()
    .min(2, 'Mínimo 2 caracteres')
    .max(100, 'Máximo 100 caracteres')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Apenas letras minúsculas, números e hífens'),
  descricao: z.string().max(255).optional().or(z.literal('')),
  icone: z.string().max(255).optional().or(z.literal('')),
  ordem: z.coerce.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  modulo: ModuleDto;
  onClose: () => void;
}

export function EditModuloDialog({ modulo, onClose }: Props) {
  const update = useUpdateModule();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  useEffect(() => {
    reset({
      nome: modulo.nome,
      slug: modulo.slug,
      descricao: modulo.descricao ?? '',
      icone: modulo.icone ?? '',
      ordem: modulo.ordem,
      isActive: modulo.isActive,
    });
  }, [modulo, reset]);

  function onSubmit(data: FormData) {
    update.mutate(
      {
        id: modulo.id,
        payload: {
          nome: data.nome,
          slug: data.slug,
          descricao: data.descricao ?? null,
          icone: data.icone ?? null,
          ordem: data.ordem,
          isActive: data.isActive,
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
        <h2 className="text-base font-semibold text-foreground mb-5">Editar Módulo</h2>
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
            <label className="block text-sm text-muted-foreground mb-1" htmlFor="edit-slug">
              Slug <span className="text-danger">*</span>
            </label>
            <input
              id="edit-slug"
              {...register('slug')}
              className="w-full rounded-lg bg-background border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring font-mono"
            />
            {errors.slug && <p className="text-danger text-xs mt-1">{errors.slug.message}</p>}
          </div>
          <div>
            <label className="block text-sm text-muted-foreground mb-1" htmlFor="edit-descricao">
              Descrição
            </label>
            <textarea
              id="edit-descricao"
              {...register('descricao')}
              rows={2}
              className="w-full rounded-lg bg-background border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
            {errors.descricao && <p className="text-danger text-xs mt-1">{errors.descricao.message}</p>}
          </div>
          <div>
            <label className="block text-sm text-muted-foreground mb-1" htmlFor="edit-ordem">
              Ordem de exibição
            </label>
            <input
              id="edit-ordem"
              type="number"
              min={0}
              {...register('ordem')}
              className="w-full rounded-lg bg-background border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            {errors.ordem && <p className="text-danger text-xs mt-1">{errors.ordem.message}</p>}
          </div>
          <div className="flex items-center gap-3">
            <Checkbox
              id="edit-isActive"
              {...register('isActive')}
            />
            <label className="text-sm text-muted-foreground cursor-pointer" htmlFor="edit-isActive">
              Módulo ativo
            </label>
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
