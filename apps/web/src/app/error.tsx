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
      <h2 className="text-2xl font-bold text-foreground">
        Algo deu errado
      </h2>
      <p className="max-w-md text-muted-foreground">
        Ocorreu um erro inesperado. Nossa equipe já foi notificada
        automaticamente.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-2 rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        Tentar novamente
      </button>
    </main>
  );
}
