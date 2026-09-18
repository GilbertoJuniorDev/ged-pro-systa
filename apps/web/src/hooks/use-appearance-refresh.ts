'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { revalidateAppearanceCache } from '@/lib/actions/revalidate-appearance';
import type { LogoScope } from '@/lib/appearance';

/**
 * Propaga uma mudança de aparência para TODAS as camadas que a mostram.
 *
 * `invalidateQueries` sozinho só atualiza o estado client-side do React Query — ou seja,
 * o próprio formulário. As cores que o usuário vê na tela vêm do `<style>` que o
 * RootLayout renderiza no servidor a partir de um `fetch` cacheado, e esse não é tocado
 * pelo React Query. Sem os dois passos abaixo o admin salva, recebe o toast de sucesso e
 * não vê nada mudar — que era exatamente o sintoma relatado.
 *
 * A ordem importa: primeiro invalidar o Data Cache (Server Action), só então pedir o
 * re-render. `router.refresh()` antes da action re-executaria o layout contra o cache
 * velho e repintaria a cor antiga.
 */
export function useAppearanceRefresh(scope: LogoScope): () => Promise<void> {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['admin-appearance', scope] });
    await queryClient.invalidateQueries({ queryKey: ['public-appearance', scope] });
    await revalidateAppearanceCache(scope);
    router.refresh();
  }, [queryClient, router, scope]);
}
