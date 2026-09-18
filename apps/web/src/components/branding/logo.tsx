'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { buildLogoUrl, type LogoScope } from '@/lib/appearance';
import { usePublicPortalAppearance, usePublicSystemAppearance } from '@/hooks/use-public-appearance';

interface LogoProps {
  readonly scope: LogoScope;
  readonly variant?: 'mark' | 'mark+wordmark';
  readonly className?: string;
}

const WORDMARK: Record<LogoScope, string> = {
  system: 'GED Pro',
  portal: 'GED Pro',
};

const MARK_COLOR_VAR: Record<LogoScope, string> = {
  system: 'var(--color-primary)',
  portal: 'var(--portal-color-primary)',
};

/**
 * Logo compartilhado do sistema/portal — usa o logo customizado (upload do admin) quando
 * configurado, com fallback para a marca "documento" embutida. `scope` decide de qual
 * config (sistema ou portal — independentes) ler `hasLogo`/`logoVersion`.
 */
export function Logo({ scope, variant = 'mark+wordmark', className }: LogoProps) {
  const systemQuery = usePublicSystemAppearance(scope === 'system');
  const portalQuery = usePublicPortalAppearance(scope === 'portal');
  const { data } = scope === 'system' ? systemQuery : portalQuery;

  const logoVersion = data?.logoVersion ?? 0;
  // O banco pode dizer que há logo enquanto o binário não está disponível (arquivo
  // perdido, storage fora do ar). Sem este fallback a UI mostra um <img> quebrado e a
  // marca embutida nunca aparece -- que era o sintoma de "o logo não funciona".
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [logoVersion, scope]);

  const hasLogo = (data?.hasLogo ?? false) && !failed;

  return (
    <span className={`inline-flex items-center gap-3 ${className ?? ''}`}>
      {hasLogo ? (
        <span className="relative block h-8 w-8 shrink-0">
          <Image
            src={buildLogoUrl(scope, logoVersion)}
            alt={WORDMARK[scope]}
            fill
            sizes="32px"
            style={{ objectFit: 'contain' }}
            // `unoptimized` é obrigatório aqui, não uma otimização: buildLogoUrl usa
            // NEXT_PUBLIC_API_URL (http://localhost:3333), que só faz sentido para o
            // BROWSER. O otimizador de imagem do Next roda no servidor -- dentro do
            // container `web`, em Docker -- onde localhost:3333 não tem nada escutando
            // (a API responde em http://api:3333). Sem isto o logo simplesmente não
            // carrega em Docker. Servir direto também não custa nada: é um PNG de 32px.
            unoptimized
            onError={() => setFailed(true)}
          />
        </span>
      ) : (
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg shadow-md"
          style={{ backgroundColor: MARK_COLOR_VAR[scope] }}
        >
          <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </span>
      )}

      {variant === 'mark+wordmark' && (
        <span className="text-xl font-bold tracking-tight" style={{ color: MARK_COLOR_VAR[scope] }}>
          {WORDMARK[scope]}
        </span>
      )}
    </span>
  );
}
