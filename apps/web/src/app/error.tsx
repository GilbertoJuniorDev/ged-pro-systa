'use client';

import { useEffect } from 'react';
import { reportUnknown } from '@/lib/error-reporter';

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorBoundary({ error, reset }: Props): React.JSX.Element {
  useEffect(() => {
    reportUnknown(error, { digest: error.digest });
  }, [error]);

  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-8 text-center">
      <h2 className="text-2xl font-bold text-slate-950 dark:text-slate-100">
        Algo deu errado
      </h2>
      <p className="max-w-md text-slate-600 dark:text-slate-400">
        Ocorreu um erro inesperado. Nossa equipe já foi notificada
        automaticamente.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white transition-colors hover:bg-indigo-500"
      >
        Tentar novamente
      </button>
    </main>
  );
}
