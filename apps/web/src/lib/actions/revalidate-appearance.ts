'use server';

import { revalidateTag } from 'next/cache';
import { auth } from '@/lib/auth';
import { APPEARANCE_CACHE_TAG, type LogoScope } from '@/lib/appearance';

/**
 * Invalida o Data Cache da aparência depois que o admin salva.
 *
 * Por que uma Server Action e não um route handler: o `matcher` do middleware.ts exclui
 * `/api`, então um route handler ficaria fora do guard de autenticação e precisaria
 * replicá-lo. Por que `revalidateTag` e não `revalidatePath`: RootLayout chama `auth()`
 * (lê cookies), logo a rota já é dinâmica e não há Full Route Cache a invalidar -- o que
 * segura a cor antiga é o Data Cache do `fetch` em lib/appearance.ts.
 *
 * A checagem de role é defesa em profundidade: um cache bust anônimo seria um DoS barato.
 */
export async function revalidateAppearanceCache(scope: LogoScope): Promise<void> {
  const session = await auth();
  const role = session?.user?.role;

  if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') return;

  revalidateTag(APPEARANCE_CACHE_TAG[scope]);
}
