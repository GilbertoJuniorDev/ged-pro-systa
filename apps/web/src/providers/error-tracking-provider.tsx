'use client';

import { useEffect } from 'react';
import { reportError, reportUnknown } from '@/lib/error-reporter';

/**
 * Captura erros globais não tratados do navegador:
 * - `error` (exceções síncronas que escapam dos boundaries React)
 * - `unhandledrejection` (Promise rejeitadas sem .catch)
 *
 * Renderiza `null` — somente efeito colateral.
 */
export function ErrorTrackingProvider(): null {
  useEffect(() => {
    function onError(event: ErrorEvent): void {
      if (event.error instanceof Error) {
        reportUnknown(event.error, {
          type: 'window.error',
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        });
      } else {
        void reportError({
          message: event.message ?? 'Unknown window error',
          context: { type: 'window.error' },
        });
      }
    }

    function onUnhandledRejection(event: PromiseRejectionEvent): void {
      reportUnknown(event.reason, { type: 'unhandledrejection' });
    }

    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onUnhandledRejection);

    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onUnhandledRejection);
    };
  }, []);

  return null;
}
