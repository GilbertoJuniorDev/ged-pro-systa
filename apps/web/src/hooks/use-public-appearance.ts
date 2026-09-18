'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import {
  useServerPortalAppearance,
  useServerSystemAppearance,
} from '@/providers/appearance-provider';
import type { PortalAppearanceDto, SystemAppearanceDto } from '@/types';

const STALE_TIME_MS = 60_000;

// Leitura anônima (sem token) — mesmos endpoints usados no servidor por
// lib/appearance.ts, aqui reaproveitados client-side pelo componente <Logo />.
// `enabled` existe para o caller (Logo) poder chamar os dois hooks incondicionalmente
// (regra dos hooks) sem disparar rede para o scope que não está sendo exibido.
//
// `initialData` vem do valor que o servidor já buscou (ver providers/appearance-provider):
// com `staleTime` de 60s o React Query o considera fresco e NÃO dispara rede nenhuma, o
// que elimina um XHR redundante por carregamento e o flash da marca de fallback.
export function usePublicSystemAppearance(enabled = true) {
  const serverAppearance = useServerSystemAppearance();

  return useQuery<SystemAppearanceDto>({
    queryKey: ['public-appearance', 'system'],
    queryFn: () => apiClient.get<SystemAppearanceDto>('/public/appearance/system'),
    staleTime: STALE_TIME_MS,
    enabled,
    ...(serverAppearance !== null && { initialData: serverAppearance }),
  });
}

export function usePublicPortalAppearance(enabled = true) {
  const serverAppearance = useServerPortalAppearance();

  return useQuery<PortalAppearanceDto>({
    queryKey: ['public-appearance', 'portal'],
    queryFn: () => apiClient.get<PortalAppearanceDto>('/public/appearance/portal'),
    staleTime: STALE_TIME_MS,
    enabled,
    ...(serverAppearance !== null && { initialData: serverAppearance }),
  });
}
