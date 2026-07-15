'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import { detectarTipoDocumento } from '@ged/utils';
import type { PublicDocumentDto, RegisterAccessInput } from '@/types';
import { useRegisterAccess } from '@/hooks/use-public-documents';
import { downloadPublicFile } from '@/lib/public-download';
import { saveVisitante } from './use-portal-download';
import { cadastroDownloadSchema, type CadastroDownloadFormData } from './cadastro-download-schema';
import { CadastroDownloadFields } from './cadastro-download-fields';

interface CadastroDownloadModalProps {
  readonly document: PublicDocumentDto;
  readonly onClose: () => void;
}

// Formulário de pré-cadastro (RHF + zod) exigido para baixar documentos com
// exigeCadastro=true. O tipo (CPF/CNPJ) é auto-detectado pela contagem de dígitos
// enquanto o usuário digita (11 → CPF, 14 → CNPJ) via detectarTipoDocumento — optamos por
// essa abordagem em vez de um toggle explícito para reduzir o número de campos do form.
export function CadastroDownloadModal({ document: doc, onClose }: CadastroDownloadModalProps) {
  const registerAccess = useRegisterAccess();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<CadastroDownloadFormData>({
    resolver: zodResolver(cadastroDownloadSchema),
    defaultValues: { email: '', nome: '', documento: '' },
  });

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  function onSubmit(data: CadastroDownloadFormData) {
    const tipoDocumento = detectarTipoDocumento(data.documento);
    if (!tipoDocumento) return; // inatingível: já validado pelo schema acima

    const input: RegisterAccessInput = {
      email: data.email,
      nome: data.nome,
      documento: data.documento,
      tipoDocumento,
    };

    registerAccess.mutate(
      { documentId: doc.id, input },
      {
        onSuccess: ({ downloadToken }) => {
          saveVisitante(input);
          void downloadPublicFile(doc.id, doc.arquivoNome, downloadToken).catch(() => {
            toast.error('Erro ao baixar o arquivo.');
          });
          onClose();
        },
      },
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cadastro-download-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-1 flex items-start justify-between gap-4">
          <div>
            <h2 id="cadastro-download-title" className="text-lg font-semibold text-slate-900">
              Cadastro para download
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Este documento exige um cadastro rápido antes do download.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="shrink-0 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mb-5 truncate text-sm font-medium text-indigo-600">{doc.nome}</p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <CadastroDownloadFields register={register} control={control} errors={errors} />

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-600 transition-colors hover:text-slate-900"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={registerAccess.isPending}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500 disabled:opacity-50"
            >
              {registerAccess.isPending ? 'Enviando…' : 'Cadastrar e baixar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
