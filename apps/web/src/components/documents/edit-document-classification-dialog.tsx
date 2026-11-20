'use client';

import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';
import type { DocumentDto, UpdateDocumentInput } from '@/types';
import { useUpdateDocument } from '@/hooks/use-documents';
import { useDepartments } from '@/hooks/use-departments';
import { useDocumentSeries } from '@/hooks/use-document-series';
import { useDossieOptions } from '@/hooks/use-dossies';
import { useAuth } from '@/hooks/use-auth';
import { isFullAccessRole } from '@/hooks/use-permissions';
import { Combobox } from '@/components/ui/combobox';

const schema = z.object({
  serieId: z.string().optional().or(z.literal('')),
  dossieId: z.string().optional().or(z.literal('')),
});

type FormData = z.infer<typeof schema>;

interface Props {
  document: DocumentDto;
  onClose: () => void;
}

export function EditDocumentClassificationDialog({ document, onClose }: Props) {
  const updateDocument = useUpdateDocument();
  const { user } = useAuth();
  const isAdmin = isFullAccessRole(user?.role);
  const { data: departamentos } = useDepartments(isAdmin);

  const isDepartamentoLocked = document.departamentoId !== null;
  const [departamentoId, setDepartamentoId] = useState(document.departamentoId ?? '');
  const effectiveDepartamentoId = isDepartamentoLocked
    ? (document.departamentoId ?? undefined)
    : departamentoId ?? undefined;

  const { data: series } = useDocumentSeries(effectiveDepartamentoId);
  const { data: dossies } = useDossieOptions(effectiveDepartamentoId);

  const {
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      serieId: document.serieId ?? '',
      dossieId: document.dossieId ?? '',
    },
  });

  useEffect(() => {
    if (isDepartamentoLocked) return;
    setValue('serieId', '');
    setValue('dossieId', '');
  }, [departamentoId, isDepartamentoLocked, setValue]);

  const departamentoOptions = isAdmin
    ? (departamentos ?? []).map((d) => ({ value: d.id, label: d.nome }))
    : (user?.departamentos ?? [])
        .filter((d) => d.id === user?.selectedDepartmentId)
        .map((d) => ({ value: d.id, label: d.nome }));
  const departamentoNomeAtual = document.departamentoId
    ? (departamentos?.find((d) => d.id === document.departamentoId)?.nome ?? '—')
    : null;
  const serieOptions = (series ?? []).map((s) => ({ value: s.id, label: `${s.codigo} — ${s.nome}` }));
  const dossieOptions = [
    { value: '', label: 'Nenhum (avulso)' },
    ...(dossies ?? []).map((d) => ({ value: d.id, label: d.nome })),
  ];

  function onSubmit(data: FormData) {
    const serieChanged = !!data.serieId && data.serieId !== (document.serieId ?? '');
    const dossieChanged = data.dossieId !== (document.dossieId ?? '');
    if (!serieChanged && !dossieChanged) {
      onClose();
      return;
    }
    const payload: UpdateDocumentInput = {
      ...(serieChanged ? { serieId: data.serieId } : {}),
      ...(dossieChanged ? { dossieId: data.dossieId === '' ? null : data.dossieId } : {}),
    };
    updateDocument.mutate({ id: document.id, payload }, { onSuccess: onClose });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface-elevated p-6 shadow-xl">
        <div className="mb-5 flex items-start justify-between">
          <div className="min-w-0">
            <p className="font-semibold text-foreground">Alterar classificação</p>
            <p className="mt-0.5 truncate text-sm text-muted-foreground">&quot;{document.nome}&quot;</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="shrink-0 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-muted-foreground">Departamento</label>
            {isDepartamentoLocked ? (
              <p className="rounded-lg border border-border bg-foreground/10 px-3.5 py-2.5 text-sm text-foreground">
                {departamentoNomeAtual}
              </p>
            ) : (
              <Combobox
                value={departamentoId}
                onValueChange={setDepartamentoId}
                options={departamentoOptions}
                placeholder="Selecione o departamento"
              />
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm text-muted-foreground">Série</label>
            <Controller
              name="serieId"
              control={control}
              render={({ field }) => (
                <Combobox
                  value={field.value}
                  onValueChange={field.onChange}
                  options={serieOptions}
                  placeholder={effectiveDepartamentoId ? 'Selecione a série' : 'Selecione um departamento primeiro'}
                  disabled={!effectiveDepartamentoId}
                  error={!!errors.serieId}
                />
              )}
            />
            {errors.serieId && <p className="mt-1 text-xs text-danger">{errors.serieId.message}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm text-muted-foreground">Dossiê</label>
            <Controller
              name="dossieId"
              control={control}
              render={({ field }) => (
                <Combobox
                  value={field.value ?? ''}
                  onValueChange={field.onChange}
                  options={dossieOptions}
                  placeholder="Nenhum (avulso)"
                  disabled={!effectiveDepartamentoId}
                />
              )}
            />
          </div>

          <div className="flex justify-end gap-3 border-t border-border pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={updateDocument.isPending}
              className="px-4 py-2 text-sm text-foreground transition-colors hover:text-foreground disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={updateDocument.isPending}
              className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-50"
            >
              {updateDocument.isPending ? 'Salvando…' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
