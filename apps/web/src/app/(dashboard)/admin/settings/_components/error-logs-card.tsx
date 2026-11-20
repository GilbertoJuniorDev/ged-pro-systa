'use client';

import { useState, useEffect } from 'react';
import { NavLinkButton } from '@/components/ui/nav-link-button';
import { useErrorLogs } from '@/hooks/use-error-logs';
import {
  useSystemSetting,
  useUpdateSystemSetting,
} from '@/hooks/use-system-settings';

function formatTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function truncate(value: string, max: number): string {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

export function ErrorLogsCard() {
  const { data, isLoading } = useErrorLogs({ limit: 2, page: 1 });
  const logs = data?.data ?? [];

  const { data: settingData, isLoading: isSettingLoading } =
    useSystemSetting('error_alert_email');
  const updateSetting = useUpdateSystemSetting('error_alert_email');

  const [emailInput, setEmailInput] = useState('');

  useEffect(() => {
    if (settingData !== undefined) {
      setEmailInput(settingData.value ?? '');
    }
  }, [settingData]);

  function handleSaveEmail(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = emailInput.trim();
    updateSetting.mutate(trimmed.length > 0 ? trimmed : null);
  }

  return (
    <div className="flex flex-col rounded-2xl border border-border bg-surface p-6 shadow-sm transition-all hover:border-muted-foreground hover:shadow-lg">
      <div className="mb-4 flex items-center">
        <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-xl bg-danger/10 text-danger">
          <svg
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01M4.062 19h15.876a2 2 0 001.732-3l-7.937-13.5a2 2 0 00-3.464 0L2.33 16a2 2 0 001.732 3z"
            />
          </svg>
        </div>
        <h3 className="font-bold text-foreground">
          Logs de Erro
        </h3>
      </div>

      <div className="mb-4 min-h-[56px] space-y-2">
        {isLoading && (
          <>
            <div className="h-7 animate-pulse rounded bg-foreground/10" />
            <div className="h-7 animate-pulse rounded bg-foreground/10" />
          </>
        )}

        {!isLoading && logs.length === 0 && (
          <div className="rounded bg-foreground/5 p-2 font-mono text-[11px] text-muted-foreground">
            Nenhum erro registrado.
          </div>
        )}

        {logs.map((log) => (
          <div
            key={log.id}
            className="truncate rounded bg-foreground/5 p-2 font-mono text-[11px] text-muted-foreground"
            title={log.message}
          >
            [{formatTime(log.createdAt)}] {log.level.toUpperCase()} ·{' '}
            {truncate(log.message, 60)}
          </div>
        ))}
      </div>

      <form onSubmit={handleSaveEmail} className="mb-4 space-y-2">
        <label
          htmlFor="error-alert-email"
          className="block text-xs font-medium text-muted-foreground"
        >
          E-mail para alertas críticos
        </label>
        <div className="flex gap-2">
          <input
            id="error-alert-email"
            type="email"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            disabled={isSettingLoading || updateSetting.isPending}
            placeholder="admin@empresa.com"
            className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-danger focus:outline-none focus:ring-1 focus:ring-danger disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isSettingLoading || updateSetting.isPending}
            className="rounded-lg bg-danger px-3 py-1.5 text-xs font-semibold text-background transition-colors hover:bg-danger/90 disabled:opacity-50"
          >
            {updateSetting.isPending ? 'Salvando…' : 'Salvar'}
          </button>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Deixe em branco para desabilitar os alertas por e-mail.
        </p>
      </form>

      <div className="mt-auto">
        <NavLinkButton
          href="/admin/logs"
          className="block w-full rounded-lg px-4 py-2 text-center text-sm font-medium text-muted-foreground transition-colors hover:bg-foreground/5"
        >
          Ver Logs de Erro
        </NavLinkButton>
      </div>
    </div>
  );
}
