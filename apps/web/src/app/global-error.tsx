'use client';

import { useEffect } from 'react';
import { DEFAULT_SYSTEM_APPEARANCE } from '@ged/types';
import { reportUnknown } from '@/lib/error-reporter';
import { buildSystemThemeCss } from '@/lib/theme-style';

// global-error substitui o RootLayout inteiro, então o <style> com os tokens (`--ged-*`)
// que ele injeta não existe aqui — declara os da Paleta padrão, no Tema claro (sem
// next-themes nesta tela; era claro antes também).
const FALLBACK_THEME_CSS = buildSystemThemeCss({
  ...DEFAULT_SYSTEM_APPEARANCE,
  updatedAt: new Date(0).toISOString(),
});

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: Props): React.JSX.Element {
  useEffect(() => {
    reportUnknown(error, { digest: error.digest, scope: 'global' });
  }, [error]);

  return (
    <html lang="pt-BR" className="light">
      <head>
        <style dangerouslySetInnerHTML={{ __html: FALLBACK_THEME_CSS }} />
      </head>
      <body className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-8 text-center text-foreground">
        <h2 className="text-2xl font-bold text-foreground">
          Erro crítico
        </h2>
        <p className="max-w-md text-muted-foreground">
          Não foi possível carregar a aplicação. O erro foi registrado.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-2 rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Recarregar
        </button>
      </body>
    </html>
  );
}
