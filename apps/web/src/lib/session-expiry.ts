/**
 * Contrato compartilhado da "sessão expirada".
 *
 * Escrito em `lib/auth.ts` (callback `jwt`, quando POST /auth/refresh falha) e lido em
 * `middleware.ts`, `providers/session-expiry-provider.tsx` e na rota `(auth)/sessao-expirada`.
 *
 * Módulo sem imports de propósito: `middleware.ts` roda no edge runtime.
 */
export const SESSION_ERROR = {
  /** POST /auth/refresh falhou — refresh token expirado, revogado ou já rotacionado. */
  REFRESH_TOKEN: 'RefreshTokenError',
} as const;

export type SessionError = (typeof SESSION_ERROR)[keyof typeof SESSION_ERROR];

/** Rota da tela interstitial de sessão expirada. */
export const SESSION_EXPIRED_ROUTE = '/sessao-expirada';

/** Destino do `signOut` disparado pela tela. */
export const LOGIN_ROUTE = '/login';
