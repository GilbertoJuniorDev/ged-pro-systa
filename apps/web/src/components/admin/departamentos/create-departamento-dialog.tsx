'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateDepartment } from '@/hooks/use-departments';

const schema = z.object({
  nome: z.string().min(2, 'Mínimo 2 caracteres').max(100, 'Máximo 100 caracteres'),
  descricao: z.string().max(255, 'Máximo 255 caracteres').optional().or(z.literal('')),
});

type FormData = z.infer<typeof schema>;

interface Props {
  onClose: () => void;
}

export function CreateDepartamentoDialog({ onClose }: Props) {
  const create = useCreateDepartment();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  function onSubmit(data: FormData) {
    create.mutate(
      {
        nome: data.nome,
        descricao: data.descricao ?? null,
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
        <h2 className="text-base font-semibold text-foreground mb-5">Novo Departamento</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm text-muted-foreground mb-1" htmlFor="nome">
              Nome <span className="text-danger">*</span>
            </label>
            <input
              id="nome"
              {...register('nome')}
              placeholder="ex: Recursos Humanos"
              className="w-full rounded-lg bg-background border border-border px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            {errors.nome && <p className="text-danger text-xs mt-1">{errors.nome.message}</p>}
          </div>
          <div>
            <label className="block text-sm text-muted-foreground mb-1" htmlFor="descricao">
              Descrição
            </label>
            <textarea
              id="descricao"
              {...register('descricao')}
              rows={2}
              placeholder="Descreva o que este departamento representa..."
              className="w-full rounded-lg bg-background border border-border px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
            {errors.descricao && <p className="text-danger text-xs mt-1">{errors.descricao.message}</p>}
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={create.isPending}
              className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={create.isPending}
              className="px-4 py-2 text-sm bg-primary hover:bg-primary-hover text-primary-foreground rounded-lg transition-colors disabled:opacity-50"
            >
              {create.isPending ? 'Criando…' : 'Criar Departamento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
