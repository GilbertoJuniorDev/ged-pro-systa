'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FileText, Upload, X } from 'lucide-react';
import { formatBytes } from '@/lib/utils';
import { CONFIDENCIALIDADE } from '@/types';
import { useUploadDocument } from '@/hooks/use-documents';
import { useDepartments } from '@/hooks/use-departments';
import { useDocumentSeries } from '@/hooks/use-document-series';
import { useDossies } from '@/hooks/use-dossies';
import { useAuth } from '@/hooks/use-auth';
import { usePermissions } from '@/hooks/use-permissions';
import { Combobox } from '@/components/ui/combobox';
import { DatePicker } from '@/components/ui/date-picker';
import { ConfidentialitySection } from '@/components/documents/confidentiality-section';
import { confidentialitySchema } from '@/components/documents/confidentiality-schema';

const ALLOWED_EXTENSIONS = '.pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.txt';
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg',
  'image/png',
  'text/plain',
];
const MAX_FILE_SIZE = 26_214_400; // 25MB — mesmo limite do backend

const schema = z.object({
  nome: z.string().min(2, 'Mínimo 2 caracteres').max(200, 'Máximo 200 caracteres'),
  descricao: z.string().max(1000, 'Máximo 1000 caracteres').optional().or(z.literal('')),
  validade: z.string().optional().or(z.literal('')),
  departamentoId: z.string().uuid('Selecione um departamento'),
  serieId: z.string().uuid('Selecione uma série'),
  dossieId: z.string().optional().or(z.literal('')),
  confidentiality: confidentialitySchema,
});

type FormData = z.infer<typeof schema>;

export function UploadDocumentForm() {
  const router = useRouter();
  const upload = useUploadDocument();
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  const canManageConfidentiality = hasPermission('DOCUMENTS_MANAGE_CONFIDENTIALITY');
  const { data: departamentos } = useDepartments();

  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      confidentiality: {
        confidencialidade: CONFIDENCIALIDADE.RESTRITO,
        accessDepartamentoIds: [],
        accessUserIds: [],
        exigeCadastro: false,
        destaque: false,
      },
    },
  });

  useEffect(() => {
    if (user?.selectedDepartmentId) {
      setValue('departamentoId', user.selectedDepartmentId);
    }
  }, [user?.selectedDepartmentId, setValue]);

  const watchedDepartamentoId = watch('departamentoId');
  const { data: series } = useDocumentSeries(watchedDepartamentoId || undefined);
  const { data: dossies } = useDossies(watchedDepartamentoId || undefined);

  useEffect(() => {
    setValue('serieId', '');
    setValue('dossieId', '');
  }, [watchedDepartamentoId, setValue]);

  const departamentoOptions = (departamentos ?? []).map((d) => ({ value: d.id, label: d.nome }));
  const serieOptions = (series ?? []).map((s) => ({ value: s.id, label: `${s.codigo} — ${s.nome}` }));
  const dossieOptions = [
    { value: '', label: 'Nenhum (avulso)' },
    ...(dossies ?? []).map((d) => ({ value: d.id, label: d.nome })),
  ];

  function validateAndSetFile(candidate: File | undefined | null) {
    if (!candidate) return;
    if (candidate.size > MAX_FILE_SIZE) {
      setFileError('Arquivo maior que 25MB. Escolha um arquivo menor.');
      return;
    }
    if (!ALLOWED_MIME_TYPES.includes(candidate.type)) {
      setFileError('Tipo de arquivo não permitido. Use PDF, Word, Excel, imagens ou texto.');
      return;
    }
    setFileError(null);
    setFile(candidate);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    validateAndSetFile(e.dataTransfer.files[0]);
  }

  function onSubmit(data: FormData) {
    if (!file) {
      setFileError('Selecione um arquivo para enviar');
      return;
    }
    upload.mutate(
      {
        file,
        nome: data.nome,
        descricao: data.descricao === '' ? undefined : data.descricao,
        validade: data.validade === '' ? undefined : data.validade,
        confidencialidade: data.confidentiality.confidencialidade,
        departamentoId: data.departamentoId,
        serieId: data.serieId,
        dossieId: data.dossieId === '' ? undefined : data.dossieId,
        destaque: data.confidentiality.destaque,
        exigeCadastro: data.confidentiality.exigeCadastro,
        accessDepartamentoIds: data.confidentiality.accessDepartamentoIds,
        accessUserIds: data.confidentiality.accessUserIds,
      },
      { onSuccess: () => router.push('/documents') },
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Dropzone */}
      <div>
        <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1.5">
          Arquivo <span className="text-rose-500 dark:text-rose-400">*</span>
        </label>
        <input
          ref={fileInputRef}
          type="file"
          accept={ALLOWED_EXTENSIONS}
          className="sr-only"
          onChange={(e) => validateAndSetFile(e.target.files?.[0])}
        />
        {file ? (
          <div className="flex items-center gap-3 rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800/60">
            <FileText className="h-8 w-8 shrink-0 text-indigo-500 dark:text-indigo-400" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">{file.name}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{formatBytes(file.size)}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setFile(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
              aria-label="Remover arquivo"
              className="shrink-0 rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click();
            }}
            role="button"
            tabIndex={0}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`flex min-h-[160px] cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors ${
              isDragging
                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/20'
                : 'border-slate-300 hover:border-slate-400 dark:border-slate-700 dark:hover:border-slate-600'
            }`}
          >
            <Upload className="h-8 w-8 text-slate-400 dark:text-slate-500" />
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Arraste um arquivo ou clique para selecionar
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-500">
              PDF, Word, Excel, imagens ou texto — máx. 25MB
            </p>
          </div>
        )}
        {fileError && <p className="text-rose-500 dark:text-rose-400 text-xs mt-1">{fileError}</p>}
      </div>

      <div>
        <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1" htmlFor="nome">
          Nome <span className="text-rose-500 dark:text-rose-400">*</span>
        </label>
        <input
          id="nome"
          {...register('nome')}
          placeholder="ex: Contrato de Prestação de Serviços"
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500"
        />
        {errors.nome && <p className="text-rose-500 dark:text-rose-400 text-xs mt-1">{errors.nome.message}</p>}
      </div>

      <div>
        <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1" htmlFor="descricao">
          Descrição
        </label>
        <textarea
          id="descricao"
          {...register('descricao')}
          rows={2}
          placeholder="Descreva o conteúdo do documento..."
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500"
        />
        {errors.descricao && <p className="text-rose-500 dark:text-rose-400 text-xs mt-1">{errors.descricao.message}</p>}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">
            Departamento <span className="text-rose-500 dark:text-rose-400">*</span>
          </label>
          <Controller
            name="departamentoId"
            control={control}
            render={({ field }) => (
              <Combobox
                value={field.value}
                onValueChange={field.onChange}
                options={departamentoOptions}
                placeholder="Selecione o departamento"
                error={!!errors.departamentoId}
              />
            )}
          />
          {errors.departamentoId && (
            <p className="text-rose-500 dark:text-rose-400 text-xs mt-1">{errors.departamentoId.message}</p>
          )}
        </div>
        <div>
          <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">Validade</label>
          <Controller
            name="validade"
            control={control}
            render={({ field }) => (
              <DatePicker value={field.value} onChange={field.onChange} placeholder="Data de validade" />
            )}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">
            Série <span className="text-rose-500 dark:text-rose-400">*</span>
          </label>
          <Controller
            name="serieId"
            control={control}
            render={({ field }) => (
              <Combobox
                value={field.value}
                onValueChange={field.onChange}
                options={serieOptions}
                placeholder={watchedDepartamentoId ? 'Selecione a série' : 'Selecione um departamento primeiro'}
                disabled={!watchedDepartamentoId}
                error={!!errors.serieId}
              />
            )}
          />
          {errors.serieId && <p className="text-rose-500 dark:text-rose-400 text-xs mt-1">{errors.serieId.message}</p>}
        </div>
        <div>
          <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">Dossiê</label>
          <Controller
            name="dossieId"
            control={control}
            render={({ field }) => (
              <Combobox
                value={field.value ?? ''}
                onValueChange={field.onChange}
                options={dossieOptions}
                placeholder="Nenhum (avulso)"
                disabled={!watchedDepartamentoId}
              />
            )}
          />
        </div>
      </div>

      <div>
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

      <div className="flex justify-end gap-3 border-t border-slate-200 pt-5 dark:border-slate-700">
        <button
          type="button"
          onClick={() => router.push('/documents')}
          disabled={upload.isPending}
          className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 transition-colors disabled:opacity-50 dark:text-slate-400 dark:hover:text-slate-100"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={upload.isPending}
          className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors disabled:opacity-50"
        >
          {upload.isPending ? 'Enviando…' : 'Enviar Documento'}
        </button>
      </div>
    </form>
  );
}
