'use client';

import { useState } from 'react';
import {
  useErrorLogs,
  type ErrorLogDto,
  type ErrorLogFilters,
  type ErrorLogLevel,
  type ErrorLogSource,
} from '@/hooks/use-error-logs';
import { Combobox, type ComboboxOption } from '@/components/ui/combobox';
import { DatePicker } from '@/components/ui/date-picker';

interface Props {
  initialFilters?: ErrorLogFilters;
}

const LEVEL_COLORS: Record<ErrorLogLevel, string> = {
  warn: 'text-warning border-warning/30',
  error: 'bg-danger/10 text-danger border-danger/30',
  fatal: 'bg-primary-soft text-primary border-primary/40',
};

const SOURCE_LABELS: Record<ErrorLogSource, string> = {
  api: 'API',
  'web-client': 'Web (browser)',
  'web-server': 'Web (SSR)',
};

const SOURCE_OPTIONS: readonly ComboboxOption[] = [
  { value: '', label: 'Todas as origens' },
  { value: 'api', label: 'API' },
  { value: 'web-client', label: 'Web (browser)' },
  { value: 'web-server', label: 'Web (SSR)' },
];

const LEVEL_OPTIONS: readonly ComboboxOption[] = [
  { value: '', label: 'Todos os níveis' },
  { value: 'warn', label: 'Warn' },
  { value: 'error', label: 'Error' },
  { value: 'fatal', label: 'Fatal' },
];

interface FormState {
  source: string;
  level: string;
  search: string;
  dateFrom: string;
  dateTo: string;
}

const EMPTY_FORM: FormState = {
  source: '',
  level: '',
  search: '',
  dateFrom: '',
  dateTo: '',
};

export function ErrorLogTable({ initialFilters }: Props) {
  const [filters, setFilters] = useState<ErrorLogFilters>({
    page: 1,
    limit: 20,
    ...initialFilters,
  });
  const [form, setForm] = useState<FormState>({
    source: initialFilters?.source ?? '',
    level: initialFilters?.level ?? '',
    search: initialFilters?.search ?? '',
    dateFrom: initialFilters?.dateFrom ?? '',
    dateTo: initialFilters?.dateTo ?? '',
  });
  const [selected, setSelected] = useState<ErrorLogDto | null>(null);

  const { data, isLoading, isError } = useErrorLogs(filters);

  function handleFilter(e: React.FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    setFilters({
      page: 1,
      limit: 20,
      source: (form.source as ErrorLogSource) || undefined,
      level: (form.level as ErrorLogLevel) || undefined,
      search: form.search || undefined,
      dateFrom: form.dateFrom || undefined,
      dateTo: form.dateTo || undefined,
    });
  }

  function handleClear(): void {
    setForm(EMPTY_FORM);
    setFilters({ page: 1, limit: 20 });
  }

  function goToPage(page: number): void {
    setFilters((prev) => ({ ...prev, page }));
  }

  const totalPages = data ? Math.ceil(data.total / (data.limit ?? 20)) : 1;
  const currentPage = data?.page ?? 1;

  return (
    <div className="space-y-4">
      <form
        onSubmit={handleFilter}
        className="flex flex-wrap gap-3 rounded-xl border border-border bg-surface p-4"
      >
        <Combobox
          value={form.source}
          onValueChange={(value) => setForm((f) => ({ ...f, source: value }))}
          options={SOURCE_OPTIONS}
          placeholder="Todas as origens"
          className="w-48"
        />
        <Combobox
          value={form.level}
          onValueChange={(value) => setForm((f) => ({ ...f, level: value }))}
          options={LEVEL_OPTIONS}
          placeholder="Todos os níveis"
          className="w-40"
        />
        <input
          name="search"
          placeholder="Buscar mensagem"
          value={form.search}
          onChange={(e) => setForm((f) => ({ ...f, search: e.target.value }))}
          className="w-64 rounded-lg border border-border bg-surface px-3 py-2 text-sm"
        />
        <DatePicker
          value={form.dateFrom}
          onChange={(value) => setForm((f) => ({ ...f, dateFrom: value }))}
          placeholder="Data inicial"
          className="w-44"
        />
        <DatePicker
          value={form.dateTo}
          onChange={(value) => setForm((f) => ({ ...f, dateTo: value }))}
          placeholder="Data final"
          className="w-44"
        />
        <button
          type="submit"
          className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground transition-colors hover:bg-primary-hover"
        >
          Filtrar
        </button>
        <button
          type="button"
          onClick={handleClear}
          className="px-4 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          Limpar
        </button>
      </form>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[900px] text-sm">
          <thead>
            <tr className="border-b border-border bg-foreground/5">
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Data</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Origem</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Nível</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Mensagem</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Usuário</th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 7 }).map((__, j) => (
                    <td key={j} className="px-4 py-3">
                      <div
                        className="h-4 animate-pulse rounded bg-foreground/10"
                        style={{ width: `${50 + ((j * 11) % 40)}%` }}
                      />
                    </td>
                  ))}
                </tr>
              ))
            ) : isError ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-danger">
                  Erro ao carregar logs.
                </td>
              </tr>
            ) : data?.data.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                  Nenhum log encontrado.
                </td>
              </tr>
            ) : (
              data?.data.map((log) => (
                <tr
                  key={log.id}
                  className="transition-colors hover:bg-foreground/5"
                >
                  <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                    {new Date(log.createdAt).toLocaleString('pt-BR')}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {SOURCE_LABELS[log.source]}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded border px-2 py-0.5 font-mono text-xs uppercase ${LEVEL_COLORS[log.level]}`}
                    >
                      {log.level}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                    {log.statusCode ?? '—'}
                  </td>
                  <td className="max-w-md truncate px-4 py-3 text-muted-foreground">
                    {log.message}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {log.userEmail ?? log.userId ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => setSelected(log)}
                      className="text-xs text-primary hover:underline"
                    >
                      Detalhes
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {data && data.total > 0 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {data.total} registro{data.total !== 1 ? 's' : ''} · Página{' '}
            {currentPage} de {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage <= 1}
              className="rounded-lg border border-border px-3 py-1.5 transition-colors hover:border-muted-foreground disabled:cursor-not-allowed disabled:opacity-40"
            >
              Anterior
            </button>
            <button
              type="button"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="rounded-lg border border-border px-3 py-1.5 transition-colors hover:border-muted-foreground disabled:cursor-not-allowed disabled:opacity-40"
            >
              Próxima
            </button>
          </div>
        </div>
      )}

      {selected && (
        <ErrorLogDetail log={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}

interface DetailProps {
  readonly log: ErrorLogDto;
  readonly onClose: () => void;
}

function ErrorLogDetail({ log, onClose }: DetailProps): React.JSX.Element {
  return (
    <div
      className="fixed inset-0 z-50 flex items-stretch justify-end bg-background/80"
      onClick={onClose}
    >
      <div
        className="flex h-full w-full max-w-2xl flex-col overflow-y-auto bg-surface-elevated p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              {SOURCE_LABELS[log.source]} · {log.level.toUpperCase()}
            </h3>
            <p className="text-xs text-muted-foreground">
              {new Date(log.createdAt).toLocaleString('pt-BR')}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>

        <Field label="Mensagem">{log.message}</Field>
        {log.code && <Field label="Código">{log.code}</Field>}
        {log.statusCode !== null && (
          <Field label="Status HTTP">{log.statusCode}</Field>
        )}
        {log.method && log.url && (
          <Field label="Requisição">{`${log.method} ${log.url}`}</Field>
        )}
        {log.userEmail && <Field label="Usuário">{log.userEmail}</Field>}
        {log.userId && <Field label="User ID">{log.userId}</Field>}
        {log.requestId && <Field label="Request ID">{log.requestId}</Field>}
        {log.ip && <Field label="IP">{log.ip}</Field>}
        {log.userAgent && <Field label="User Agent">{log.userAgent}</Field>}
        {log.stack && (
          <Field label="Stack trace">
            <pre className="max-h-96 overflow-auto rounded bg-foreground/5 p-3 text-xs text-foreground">
              {log.stack}
            </pre>
          </Field>
        )}
        {log.context && Object.keys(log.context).length > 0 && (
          <Field label="Contexto">
            <pre className="max-h-64 overflow-auto rounded bg-foreground/5 p-3 text-xs text-foreground">
              {JSON.stringify(log.context, null, 2)}
            </pre>
          </Field>
        )}
      </div>
    </div>
  );
}

interface FieldProps {
  readonly label: string;
  readonly children: React.ReactNode;
}

function Field({ label, children }: FieldProps): React.JSX.Element {
  return (
    <div className="mb-3">
      <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 break-words text-sm text-foreground">
        {children}
      </div>
    </div>
  );
}
