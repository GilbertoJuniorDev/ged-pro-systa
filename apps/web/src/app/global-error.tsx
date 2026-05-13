'use client';

import { useEffect } from 'react';
import { reportUnknown } from '@/lib/error-reporter';

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: Props): React.JSX.Element {
  useEffect(() => {
    reportUnknown(error, { digest: error.digest, scope: 'global' });
  }, [error]);

  return (
    <html lang="pt-BR">
      <body className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 p-8 text-center dark:bg-slate-950">
        <h2 className="text-2xl font-bold text-slate-950 dark:text-slate-100">
          Erro crítico
        </h2>
        <p className="max-w-md text-slate-600 dark:text-slate-400">
          Não foi possível carregar a aplicação. O erro foi registrado.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white transition-colors hover:bg-indigo-500"
        >
          Recarregar
        </button>
      </body>
    </html>
  );
}
