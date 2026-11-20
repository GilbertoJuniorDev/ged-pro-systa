'use client';

import { Clock, LogIn } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { useSessionCountdown } from './use-session-countdown';

const COUNTDOWN_SECONDS = 5;

export function SessionExpiredClient() {
  const { secondsLeft, isRedirecting, redirectNow } = useSessionCountdown(COUNTDOWN_SECONDS);
  const progress = ((COUNTDOWN_SECONDS - secondsLeft) / COUNTDOWN_SECONDS) * 100;

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-background">
      {/* Fundo decorativo — mesmos orbes do seletor de departamento, sem animate-blob */}
      <div className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full bg-primary opacity-10 mix-blend-multiply blur-3xl" />
      <div className="pointer-events-none absolute -left-24 bottom-0 h-96 w-96 rounded-full bg-secondary opacity-10 mix-blend-multiply blur-3xl" />

      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-16 sm:px-10">
        <div className="w-full max-w-md animate-fade-in">
          {/* Marca */}
          <div className="mb-8 flex items-center justify-center">
            <div className="mr-3 flex h-8 w-8 items-center justify-center rounded-lg bg-primary shadow-md">
              <svg
                className="h-5 w-5 text-primary-foreground"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <span className="text-lg font-bold tracking-tight text-foreground">
              GED Pro
            </span>
          </div>

          {/* Card */}
          <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm sm:p-8">
            <div className="flex flex-col items-center text-center">
              {/* Cor nunca é o único sinal: chip warning + ícone + heading textual */}
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-warning/10 text-warning">
                <Clock className="h-6 w-6" strokeWidth={1.5} aria-hidden="true" />
              </div>

              {/*
                role="status": ao chegar por router.replace (navegação client-side) o
                leitor de tela não relê a página sozinho — a live region é o que anuncia.
              */}
              <div role="status" className="mt-4">
                <h1 className="text-2xl font-bold text-foreground">
                  Sua sessão expirou
                </h1>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Por segurança, sua sessão foi encerrada. Isso acontece após um período
                  sem uso ou quando a senha da conta é alterada. Entre novamente para
                  continuar.
                </p>
              </div>

              {/*
                aria-hidden na contagem: não metralhar o leitor de tela a cada segundo —
                a mensagem acima já foi anunciada e o botão está disponível desde t=0.
              */}
              <p
                aria-hidden="true"
                className="mt-6 text-sm font-medium text-muted-foreground"
              >
                {isRedirecting
                  ? 'Redirecionando…'
                  : `Redirecionando para a tela de login em ${secondsLeft}s`}
              </p>

              <div
                aria-hidden="true"
                className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-border"
              >
                <div
                  className="h-full rounded-full bg-primary transition-[width] duration-1000 ease-linear motion-reduce:transition-none"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <button
                type="button"
                onClick={redirectNow}
                disabled={isRedirecting}
                className="mt-6 w-full bg-primary hover:bg-primary-hover text-primary-foreground font-semibold py-3 px-4 rounded-lg transition-colors shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isRedirecting ? (
                  <span className="flex items-center justify-center gap-2">
                    <Spinner size="sm" />
                    Redirecionando…
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <LogIn className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
                    Entrar novamente
                  </span>
                )}
              </button>
            </div>
          </div>

          <p className="mt-8 text-center text-xs text-muted-foreground">
            &copy; 2026 GED Pro. Todos os direitos reservados.
          </p>
        </div>
      </main>
    </div>
  );
}
