import type { ApiError as ApiErrorType } from '@/types';

export class ApiError extends Error {
  readonly statusCode: number;
  readonly code: string;

  constructor(message: string, statusCode: number, code: string) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
  token?: string;
};

interface SuccessBody<T> {
  success: true;
  data: T;
  message: string;
  timestamp: string;
}

interface ErrorBody {
  success: false;
  error: Partial<ApiErrorType>;
  timestamp: string;
}

// Server (SSR/Auth.js): uses API_INTERNAL_URL (Docker-internal, not exposed to browser)
// Client (browser): API_INTERNAL_URL is undefined (no NEXT_PUBLIC_ prefix), falls back to NEXT_PUBLIC_API_URL
const BASE_URL = process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL ?? '';

type UnauthorizedHandler = () => void;

/**
 * Handler chamado quando a API responde 401 fora de `/auth/*`.
 *
 * Só é registrado no browser (por `SessionExpiryProvider`). No servidor — onde
 * `lib/auth.ts` chama /auth/login, /auth/refresh e /auth/me — este módulo tem outra
 * instância e o handler permanece `null`, então nunca dispara lá.
 */
let unauthorizedHandler: UnauthorizedHandler | null = null;

export function setUnauthorizedHandler(handler: UnauthorizedHandler | null): void {
  unauthorizedHandler = handler;
}

/** Em `/auth/*` um 401 é o resultado esperado (credencial inválida), não sessão expirada. */
const AUTH_PATHS_PREFIX = '/auth/';

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, token, headers: extraHeaders, ...rest } = options;
  const isFormData = body instanceof FormData;

  const headers: Record<string, string> = {
    // FormData sets its own multipart boundary — the browser must generate that header itself
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(extraHeaders as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...rest,
    headers,
    body: body === undefined ? undefined : isFormData ? body : JSON.stringify(body),
  });

  if (!response.ok) {
    const errorBody = (await response.json().catch(() => ({}))) as Partial<ErrorBody>;
    const errorDetails = errorBody.error ?? {};
    const statusCode = errorDetails.statusCode ?? response.status;

    // 401 = access token ausente/inválido/expirado (permissão negada é 403 na API).
    // Não decide nada aqui: só avisa o guard, que revalida a sessão. O access token
    // vive 15min, então um 401 sozinho não significa que a sessão morreu.
    if (statusCode === 401 && !path.startsWith(AUTH_PATHS_PREFIX)) {
      unauthorizedHandler?.();
    }

    throw new ApiError(
      errorDetails.message ?? response.statusText,
      statusCode,
      errorDetails.code ?? 'UNKNOWN_ERROR',
    );
  }

  if (response.status === 204 || response.headers.get('content-length') === '0') {
    return undefined as T;
  }

  const json = (await response.json()) as SuccessBody<T>;
  return json.data;
}

function get<T>(path: string, options?: Omit<RequestOptions, 'body'>): Promise<T> {
  return request<T>(path, { ...options, method: 'GET' });
}

function post<T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'body'>): Promise<T> {
  return request<T>(path, { ...options, method: 'POST', body });
}

function put<T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'body'>): Promise<T> {
  return request<T>(path, { ...options, method: 'PUT', body });
}

function patch<T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'body'>): Promise<T> {
  return request<T>(path, { ...options, method: 'PATCH', body });
}

function del<T>(path: string, options?: Omit<RequestOptions, 'body'>): Promise<T> {
  return request<T>(path, { ...options, method: 'DELETE' });
}

export const apiClient = { request, get, post, put, patch, delete: del };
