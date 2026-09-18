'use client';

import { createContext, useContext, type ReactNode } from 'react';
import type { PortalAppearanceDto, SystemAppearanceDto } from '@/types';

/**
 * Carrega no cliente a aparência que o servidor JÁ buscou para renderizar o `<style>`.
 *
 * Sem isto, `<Logo />` refaz a mesma chamada a `/public/appearance/{scope}` no browser em
 * todo carregamento do dashboard — um XHR anônimo redundante — e pisca a marca embutida
 * antes de `hasLogo` resolver, porque no primeiro paint ainda não sabe que há logo.
 *
 * É um context em vez de `HydrationBoundary`/`dehydrate` porque não existe `QueryClient`
 * no servidor neste repo; montar essa infra custaria bem mais que estas linhas.
 */
const SystemAppearanceContext = createContext<SystemAppearanceDto | null>(null);
const PortalAppearanceContext = createContext<PortalAppearanceDto | null>(null);

export function SystemAppearanceProvider({
  appearance,
  children,
}: {
  readonly appearance: SystemAppearanceDto;
  readonly children: ReactNode;
}) {
  return (
    <SystemAppearanceContext.Provider value={appearance}>{children}</SystemAppearanceContext.Provider>
  );
}

export function PortalAppearanceProvider({
  appearance,
  children,
}: {
  readonly appearance: PortalAppearanceDto;
  readonly children: ReactNode;
}) {
  return (
    <PortalAppearanceContext.Provider value={appearance}>{children}</PortalAppearanceContext.Provider>
  );
}

/** `null` quando o componente está fora do provider — o hook então busca pela rede. */
export function useServerSystemAppearance(): SystemAppearanceDto | null {
  return useContext(SystemAppearanceContext);
}

export function useServerPortalAppearance(): PortalAppearanceDto | null {
  return useContext(PortalAppearanceContext);
}
