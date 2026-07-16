'use client';

import Link from 'next/link';
import { ArrowRightLeft, Files, FolderOpen, HardDrive, Upload } from 'lucide-react';
import { formatBytes } from '@/lib/utils';
import { useDocuments } from '@/hooks/use-documents';
import { useDashboardAdminSummary, useDashboardSummary } from '@/hooks/use-dashboard';
import { DashboardGreeting } from './dashboard-greeting';
import { DashboardSkeleton } from './dashboard-skeleton';
import { StatCard } from './stat-card';
import { DocumentosPorFaseChart } from './documentos-por-fase-chart';
import { DocumentosPorConfidencialidadeChart } from './documentos-por-confidencialidade-chart';
import { DocumentosPorDestinacaoChart } from './documentos-por-destinacao-chart';
import { DocumentosPorMesChart } from './documentos-por-mes-chart';
import { DocumentosPorDepartamentoChart } from './documentos-por-departamento-chart';
import { RecentDocumentsList } from './recent-documents-list';

const RECENT_DOCUMENTS_LIMIT = 5;

/** Orchestrates the dashboard's data hooks and composes the KPI/chart/activity widgets. */
export function DashboardOverview() {
  const summaryQuery = useDashboardSummary();
  const adminSummaryQuery = useDashboardAdminSummary();
  const recentDocumentsQuery = useDocuments({ limit: RECENT_DOCUMENTS_LIMIT });

  if (summaryQuery.isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <main className="flex-1 p-4 sm:p-6 lg:p-8 animate-fade-in">
      <div className="mb-8">
        <DashboardGreeting />
      </div>

      {summaryQuery.isError || !summaryQuery.data ? (
        <p className="text-rose-400 text-sm">Erro ao carregar o resumo do dashboard.</p>
      ) : summaryQuery.data.totalDocumentos === 0 ? (
        <EmptyState />
      ) : (
        <DashboardContent summary={summaryQuery.data} departamentos={adminSummaryQuery.data} />
      )}

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <h3 className="mb-4 font-bold text-slate-950 dark:text-slate-100">Documentos Recentes</h3>
        <RecentDocumentsList
          documents={recentDocumentsQuery.data?.data ?? []}
          isLoading={recentDocumentsQuery.isLoading}
          isError={recentDocumentsQuery.isError}
        />
      </div>
    </main>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-300 py-16 text-center dark:border-slate-700">
      <Files className="h-10 w-10 text-slate-400 dark:text-slate-600" strokeWidth={1.5} aria-hidden="true" />
      <p className="font-medium text-slate-700 dark:text-slate-300">Nenhum documento cadastrado ainda</p>
      <p className="max-w-sm text-sm text-slate-500 dark:text-slate-500">
        Envie o primeiro documento para começar a ver estatísticas e gráficos aqui.
      </p>
      <Link
        href="/documents/upload"
        className="mt-2 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500"
      >
        <Upload className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
        Enviar documento
      </Link>
    </div>
  );
}

interface DashboardContentProps {
  readonly summary: NonNullable<ReturnType<typeof useDashboardSummary>['data']>;
  readonly departamentos: ReturnType<typeof useDashboardAdminSummary>['data'];
}

function DashboardContent({ summary, departamentos }: DashboardContentProps) {
  const temTransferenciasPendentes = summary.documentosElegiveisTransferencia > 0;

  return (
    <>
      <div className="mb-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="animate-slide-up" style={{ animationDelay: '0ms' }}>
          <StatCard title="Total de documentos" value={summary.totalDocumentos} icon={Files} accent="indigo" />
        </div>
        <div className="animate-slide-up" style={{ animationDelay: '75ms' }}>
          <StatCard
            title="Armazenamento utilizado"
            value={formatBytes(summary.armazenamentoTotalBytes)}
            icon={HardDrive}
            accent="cyan"
          />
        </div>
        <div className="animate-slide-up" style={{ animationDelay: '150ms' }}>
          <StatCard
            title="Aptos para transferência"
            value={summary.documentosElegiveisTransferencia}
            icon={ArrowRightLeft}
            accent={temTransferenciasPendentes ? 'amber' : 'emerald'}
            hint={
              temTransferenciasPendentes
                ? 'Prazo da fase corrente vencido'
                : 'Nenhum documento pendente'
            }
          />
        </div>
        <div className="animate-slide-up" style={{ animationDelay: '225ms' }}>
          <StatCard
            title="Documentos na fase corrente"
            value={summary.documentosPorFase.corrente}
            icon={FolderOpen}
            accent="violet"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <DocumentosPorFaseChart data={summary.documentosPorFase} />
        <DocumentosPorConfidencialidadeChart data={summary.documentosPorConfidencialidade} />
        <DocumentosPorDestinacaoChart data={summary.documentosPorDestinacaoFinal} />
        <DocumentosPorMesChart data={summary.documentosCriadosPorMes} />
        {departamentos && departamentos.documentosPorDepartamento.length > 0 && (
          <DocumentosPorDepartamentoChart data={departamentos.documentosPorDepartamento} />
        )}
      </div>
    </>
  );
}
