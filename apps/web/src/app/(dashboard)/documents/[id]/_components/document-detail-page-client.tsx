'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Confidencialidade, DocumentFase } from '@/types';
import { useDocument, useDeleteDocument, useDownloadDocument } from '@/hooks/use-documents';
import { useDepartments } from '@/hooks/use-departments';
import { useDocumentSeries } from '@/hooks/use-document-series';
import { useDossieOptions } from '@/hooks/use-dossies';
import { useUsers } from '@/hooks/use-users';
import { usePermissions } from '@/hooks/use-permissions';
import { formatBytes } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { EditDocumentClassificationDialog } from '@/components/documents/edit-document-classification-dialog';
import { EditConfidentialityDialog } from './edit-confidentiality-dialog';

const CONFIDENCIALIDADE_BADGE: Record<Confidencialidade, string> = {
  PUBLICO: 'bg-foreground/10 text-muted-foreground',
  RESTRITO: 'ring-1 ring-inset ring-warning/40 text-warning',
  CONFIDENCIAL: 'bg-danger/10 text-danger',
};

const CONFIDENCIALIDADE_LABEL: Record<Confidencialidade, string> = {
  PUBLICO: 'Público',
  RESTRITO: 'Restrito',
  CONFIDENCIAL: 'Confidencial',
};

const FASE_LABEL: Record<DocumentFase, string> = {
  CORRENTE: 'Corrente',
  INTERMEDIARIO: 'Intermediário',
};

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR');
}

interface DeleteConfirmProps {
  nome: string;
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
}

function DeleteConfirm({ nome, onConfirm, onCancel, isPending }: DeleteConfirmProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-surface-elevated border border-border rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6">
        <p className="text-foreground font-semibold mb-1">Remover documento?</p>
        <p className="text-muted-foreground text-sm mb-6">
          O documento <span className="text-foreground font-medium">&quot;{nome}&quot;</span> e o arquivo
          enviado serão removidos permanentemente.
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            disabled={isPending}
            className="px-4 py-2 text-sm text-foreground hover:text-foreground transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            className="px-4 py-2 text-sm bg-danger hover:bg-danger/90 text-background rounded-lg transition-colors disabled:opacity-50"
          >
            {isPending ? 'Removendo…' : 'Remover'}
          </button>
        </div>
      </div>
    </div>
  );
}

interface FieldProps {
  label: string;
  children: React.ReactNode;
}

function Field({ label, children }: FieldProps) {
  return (
    <div>
      <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</dt>
      <dd className="mt-1 text-sm text-foreground">{children}</dd>
    </div>
  );
}

export function DocumentDetailPageClient({ id }: { id: string }) {
  const router = useRouter();
  const { data: document, isLoading, isError } = useDocument(id);
  const { data: departamentos } = useDepartments();
  const { data: series } = useDocumentSeries(document?.departamentoId ?? undefined);
  const { data: dossies } = useDossieOptions(document?.departamentoId ?? undefined);
  const { data: users } = useUsers();
  const downloadDocument = useDownloadDocument();
  const deleteDocument = useDeleteDocument();
  const { hasPermission } = usePermissions();
  const canManageConfidentiality = hasPermission('DOCUMENTS_MANAGE_CONFIDENTIALITY');
  const canEdit = hasPermission('DOCUMENTS_EDIT');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEditConfidentiality, setShowEditConfidentiality] = useState(false);
  const [showEditClassification, setShowEditClassification] = useState(false);

  const backLink = (
    <Link
      href="/documents"
      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
    >
      ← Documentos
    </Link>
  );

  if (isLoading) {
    return (
      <main className="flex-1 overflow-y-auto bg-background p-4 sm:p-6 lg:p-8">
        <div className="mb-6">{backLink}</div>
        <div className="rounded-2xl border border-border bg-surface p-6">
          <Skeleton className="h-7 w-64 mb-4" />
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (isError || !document) {
    return (
      <main className="flex-1 overflow-y-auto bg-background p-4 sm:p-6 lg:p-8">
        <div className="mb-6">{backLink}</div>
        <p className="text-danger text-sm">Documento não encontrado.</p>
      </main>
    );
  }

  const departamentoNome = document.departamentoId
    ? (departamentos?.find((d) => d.id === document.departamentoId)?.nome ?? '—')
    : 'Não classificado';
  const serieLabel = (() => {
    if (!document.serieId) return 'Não classificada';
    const serie = series?.find((s) => s.id === document.serieId);
    return serie ? `${serie.codigo} — ${serie.nome}` : '—';
  })();
  const dossieNome = document.dossieId
    ? (dossies?.find((d) => d.id === document.dossieId)?.nome ?? '—')
    : null;

  // "Também visível para…" — só aparece quando há liberação extra além do
  // padrão do nível: departamentos adicionais em Restrito, ou os usuários
  // liberados em Confidencial (o próprio departamento do documento, em
  // Restrito, já tem acesso implícito e não entra aqui).
  const extraAccessNames: string[] =
    document.confidencialidade === 'RESTRITO' && document.acessoDepartamentoIds.length > 0
      ? document.acessoDepartamentoIds
          .map((depId) => departamentos?.find((d) => d.id === depId)?.nome)
          .filter((nome): nome is string => Boolean(nome))
      : document.confidencialidade === 'CONFIDENCIAL'
        ? document.acessoUsuarioIds
            .map((userId) => users?.find((u) => u.id === userId)?.name)
            .filter((nome): nome is string => Boolean(nome))
        : [];

  return (
    <main className="flex-1 overflow-y-auto bg-background p-4 sm:p-6 lg:p-8">
      <div className="mb-6">{backLink}</div>

      <div className="rounded-2xl border border-border bg-surface p-6">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-foreground">{document.nome}</h1>
            {document.descricao && <p className="mt-1 text-sm text-muted-foreground">{document.descricao}</p>}
            <div className="mt-3 flex flex-wrap gap-2">
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${CONFIDENCIALIDADE_BADGE[document.confidencialidade]}`}
              >
                {CONFIDENCIALIDADE_LABEL[document.confidencialidade]}
              </span>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  document.fase === 'CORRENTE' ? 'bg-primary-soft text-primary' : 'bg-foreground/10 text-muted-foreground'
                }`}
              >
                {FASE_LABEL[document.fase]}
              </span>
              {document.elegivelTransferencia && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset ring-success/40 text-success">
                  Elegível para transferência
                </span>
              )}
            </div>
            {extraAccessNames.length > 0 && (
              <p className="mt-2 text-xs text-muted-foreground">
                Também visível para: <span className="text-foreground">{extraAccessNames.join(', ')}</span>
              </p>
            )}
          </div>
          <div className="flex shrink-0 gap-2">
            <button
              onClick={() => downloadDocument.mutate({ id: document.id, filename: document.arquivoNome })}
              disabled={downloadDocument.isPending}
              className="px-4 py-2 text-sm bg-primary hover:bg-primary-hover text-primary-foreground rounded-lg transition-colors disabled:opacity-50"
            >
              Baixar
            </button>
            {canManageConfidentiality && (
              <button
                onClick={() => setShowEditConfidentiality(true)}
                className="px-4 py-2 text-sm text-foreground hover:text-foreground border border-border hover:border-muted-foreground rounded-lg transition-colors"
              >
                Alterar confidencialidade
              </button>
            )}
            {canEdit && (
              <button
                onClick={() => setShowEditClassification(true)}
                className="px-4 py-2 text-sm text-foreground hover:text-foreground border border-border hover:border-muted-foreground rounded-lg transition-colors"
              >
                Alterar classificação
              </button>
            )}
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-4 py-2 text-sm text-danger border border-danger/40 hover:border-danger rounded-lg transition-colors"
            >
              Remover
            </button>
          </div>
        </div>

        <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3 border-t border-border pt-6">
          <Field label="Departamento">{departamentoNome}</Field>
          <Field label="Série">{serieLabel}</Field>
          <Field label="Dossiê">{dossieNome ?? <span className="italic text-muted-foreground">Avulso</span>}</Field>
          <Field label="Validade">{formatDate(document.validade)}</Field>
          <Field label="Em corrente desde">{formatDate(document.faseCorrenteDesde)}</Field>
          <Field label="Vencimento (corrente)">{formatDate(document.vencimentoCorrente)}</Field>
          {document.faseIntermediarioDesde && (
            <Field label="Em intermediário desde">{formatDate(document.faseIntermediarioDesde)}</Field>
          )}
          {document.vencimentoIntermediario && (
            <Field label="Vencimento (intermediário)">{formatDate(document.vencimentoIntermediario)}</Field>
          )}
          <Field label="Arquivo">{document.arquivoNome}</Field>
          <Field label="Tipo">{document.arquivoMimeType}</Field>
          <Field label="Tamanho">{formatBytes(document.arquivoTamanho)}</Field>
          <Field label="Criado em">{formatDate(document.createdAt)}</Field>
          <Field label="Atualizado em">{formatDate(document.updatedAt)}</Field>
        </dl>
      </div>

      {showDeleteConfirm && (
        <DeleteConfirm
          nome={document.nome}
          isPending={deleteDocument.isPending}
          onConfirm={() => {
            deleteDocument.mutate(document.id, {
              onSuccess: () => router.push('/documents'),
              onSettled: () => setShowDeleteConfirm(false),
            });
          }}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}

      {showEditConfidentiality && (
        <EditConfidentialityDialog document={document} onClose={() => setShowEditConfidentiality(false)} />
      )}

      {showEditClassification && (
        <EditDocumentClassificationDialog document={document} onClose={() => setShowEditClassification(false)} />
      )}
    </main>
  );
}
