import {
  DEFAULT_PORTAL_APPEARANCE as SHARED_DEFAULT_PORTAL_APPEARANCE,
  DEFAULT_SYSTEM_APPEARANCE as SHARED_DEFAULT_SYSTEM_APPEARANCE,
} from '@ged/types';
import { apiClient } from './api-client';
import type { PortalAppearanceDto, SystemAppearanceDto } from '@/types';

const APPEARANCE_REVALIDATE_SECONDS = 60;

/**
 * Tags do Data Cache do Next. Salvar a aparência invalida a tag correspondente via
 * `lib/actions/revalidate-appearance.ts` — sem isso, o <style> renderizado no servidor
 * fica com a cor antiga até o cache expirar, e o admin vê um toast de sucesso sem
 * nenhuma mudança na tela.
 */
export const APPEARANCE_CACHE_TAG = {
  system: 'appearance-system',
  portal: 'appearance-portal',
} as const;

export type AppearanceCacheTag = (typeof APPEARANCE_CACHE_TAG)[keyof typeof APPEARANCE_CACHE_TAG];

// Cores/textos atuais do sistema — usados como fallback caso a API esteja fora do ar,
// para a página nunca quebrar por falta de configuração de aparência. Os valores vêm
// de @ged/types (fonte única, compartilhada com os formulários do admin).
export const DEFAULT_SYSTEM_APPEARANCE: SystemAppearanceDto = {
  ...SHARED_DEFAULT_SYSTEM_APPEARANCE,
  updatedAt: new Date(0).toISOString(),
};

export const DEFAULT_PORTAL_APPEARANCE: PortalAppearanceDto = {
  ...SHARED_DEFAULT_PORTAL_APPEARANCE,
  updatedAt: new Date(0).toISOString(),
};

/**
 * Server-only: usado em `layout.tsx`/`portal/layout.tsx` (e `portal/page.tsx`, que reusa
 * o cache de fetch do Next para não duplicar a chamada) para renderizar a aparência já no
 * HTML inicial, sem FOUC. Nunca lança — se a API estiver fora do ar, cai no fallback acima.
 */
export async function getSystemAppearance(): Promise<SystemAppearanceDto> {
  try {
    return await apiClient.get<SystemAppearanceDto>('/public/appearance/system', {
      next: { revalidate: APPEARANCE_REVALIDATE_SECONDS, tags: [APPEARANCE_CACHE_TAG.system] },
    });
  } catch {
    return DEFAULT_SYSTEM_APPEARANCE;
  }
}

export async function getPortalAppearance(): Promise<PortalAppearanceDto> {
  try {
    return await apiClient.get<PortalAppearanceDto>('/public/appearance/portal', {
      next: { revalidate: APPEARANCE_REVALIDATE_SECONDS, tags: [APPEARANCE_CACHE_TAG.portal] },
    });
  } catch {
    return DEFAULT_PORTAL_APPEARANCE;
  }
}

export type LogoScope = 'system' | 'portal';

/**
 * Monta a URL do binário do logo — sempre com `?v=<logoVersion>` (cache-busting).
 * Único ponto que monta essa URL: evita dois lugares divergentes esquecerem o `?v=`.
 * Usada pelo navegador (via `<Logo />`), então sempre a URL pública (NEXT_PUBLIC_API_URL),
 * nunca API_INTERNAL_URL (que só existe dentro da rede Docker).
 */
export function buildLogoUrl(scope: LogoScope, logoVersion: number): string {
  const base = process.env.NEXT_PUBLIC_API_URL ?? '';
  return `${base}/public/appearance/${scope}/logo?v=${logoVersion}`;
}
