/**
 * Cliente leve para reportar erros do frontend ao backend.
 *
 * - No browser: faz POST para o route handler interno `/api/error-report`,
 *   que repassa para a API privada (mantém o backend não exposto).
 * - É **best-effort**: qualquer falha é silenciada para nunca quebrar a UI.
 */

export type ErrorReportSource = 'web-client' | 'web-server';

export interface ErrorReportInput {
  readonly source?: ErrorReportSource;
  readonly message: string;
  readonly stack?: string;
  readonly url?: string;
  readonly userAgent?: string;
  readonly statusCode?: number;
  readonly context?: Record<string, unknown>;
}

const ENDPOINT = '/api/error-report';

export async function reportError(input: ErrorReportInput): Promise<void> {
  try {
    const isBrowser = typeof window !== 'undefined';
    const payload = {
      source: input.source ?? (isBrowser ? 'web-client' : 'web-server'),
      message: input.message.slice(0, 2_000),
      stack: input.stack?.slice(0, 20_000),
      url: input.url ?? (isBrowser ? window.location.href : undefined),
      userAgent:
        input.userAgent ??
        (isBrowser ? window.navigator.userAgent : undefined),
      statusCode: input.statusCode,
      context: input.context,
    };

    await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
    });
  } catch {
    // Fail-safe: jamais propaga
  }
}

export function reportUnknown(error: unknown, context?: Record<string, unknown>): void {
  if (error instanceof Error) {
    void reportError({
      message: error.message,
      stack: error.stack,
      context,
    });
    return;
  }
  void reportError({ message: String(error), context });
}
