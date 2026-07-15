'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';
import type { DocumentDto } from '@/types';
import { useUpdateDocument } from '@/hooks/use-documents';
import { usePermissions } from '@/hooks/use-permissions';
import { ConfidentialitySection } from '@/components/documents/confidentiality-section';
import { confidentialitySchema } from '@/components/documents/confidentiality-schema';

const schema = z.object({
  confidentiality: confidentialitySchema,
});

type FormData = z.infer<typeof schema>;

interface EditConfidentialityDialogProps {
  document: DocumentDto;
  onClose: () => void;
}

export function EditConfidentialityDialog({ document, onClose }: EditConfidentialityDialogProps) {
  const updateDocument = useUpdateDocument();
  const { hasPermission } = usePermissions();
  const canManageConfidentiality = hasPermission('DOCUMENTS_MANAGE_CONFIDENTIALITY');

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      confidentiality: {
        confidencialidade: document.confidencialidade,
        accessDepartamentoIds: [...document.acessoDepartamentoIds],
        accessUserIds: [...document.acessoUsuarioIds],
        exigeCadastro: document.exigeCadastro,
        destaque: document.destaque,
      },
    },
  });

  function onSubmit(data: FormData) {
    updateDocument.mutate(
      {
        id: document.id,
        payload: {
          confidencialidade: data.confidentiality.confidencialidade,
          accessDepartamentoIds: data.confidentiality.accessDepartamentoIds,
          accessUserIds: data.confidentiality.accessUserIds,
          exigeCadastro: data.confidentiality.exigeCadastro,
          destaque: data.confidentiality.destaque,
        },
      },
      { onSuccess: onClose },
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-xl">
        <div className="flex shrink-0 items-start justify-between border-b border-slate-800 px-6 py-4">
          <div className="min-w-0">
            <p className="font-semibold text-slate-100">Alterar confidencialidade</p>
            <p className="mt-0.5 truncate text-sm text-slate-400">&quot;{document.nome}&quot;</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="shrink-0 rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-800 hover:text-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 overflow-y-auto px-6 py-5">
            <Controller
              name="confidentiality"
              control={control}
              render={({ field }) => (
                <ConfidentialitySection
                  value={field.value}
                  onChange={field.onChange}
                  canManage={canManageConfidentiality}
                  errors={{
                    confidencialidade: errors.confidentiality?.confidencialidade?.message,
                    accessUserIds: errors.confidentiality?.accessUserIds?.message,
                  }}
                />
              )}
            />
          </div>

          <div className="flex shrink-0 justify-end gap-3 border-t border-slate-800 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              disabled={updateDocument.isPending}
              className="px-4 py-2 text-sm text-slate-300 transition-colors hover:text-slate-100 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={updateDocument.isPending}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white transition-colors hover:bg-indigo-500 disabled:opacity-50"
            >
              {updateDocument.isPending ? 'Salvando…' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
