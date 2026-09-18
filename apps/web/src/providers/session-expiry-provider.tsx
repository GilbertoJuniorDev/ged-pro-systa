'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getSession, useSession } from 'next-auth/react';
import { setUnauthorizedHandler } from '@/lib/api-client';
import { SESSION_ERROR, SESSION_EXPIRED_ROUTE } from '@/lib/session-expiry';

/** Rotas que NUNCA devem exibir a tela de sessão expirada. */
const EXEMPT_PREFIXES: readonly string[] = [
  '/portal', // portal público — visitante anônimo jamais vê esta tela
  '/login',
  '/reset-password',
  SESSION_EXPIRED_ROUTE, // a própria tela: evita loop de redirect
];

function isExempt(pathname: string): boolean {
  return EXEMPT_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/**
 * Guard client-side da sessão expirada. Renderiza `null` — somente efeito colateral.
 *
 * Complementa o guard de `middleware.ts`: o middleware cobre navegações (server-side,
 * sem flash); este cobre a aba parada, que não navega e por isso nunca passa por lá.
 */
export function SessionExpiryProvider(): null {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const isRecheckingRef = useRef<boolean>(false);
  const exempt = isExempt(pathname);

  useEffect(() => {
    if (exempt) return;

    setUnauthorizedHandler(() => {
      // Várias queries falhando juntas devem gerar uma única revalidação.
      if (isRecheckingRef.current) return;
      isRecheckingRef.current = true;

      // Força GET /api/auth/session → roda o callback `jwt` → tenta o refresh.
      // Refresh OK: era só o access token vencido, e o broadcast atualiza os hooks.
      // Refresh falhou: `session.error` chega e o efeito abaixo redireciona.
      void getSession().finally(() => {
        isRecheckingRef.current = false;
      });
    });

    return () => setUnauthorizedHandler(null);
  }, [exempt]);

  useEffect(() => {
    if (exempt) return;

    if (session?.error === SESSION_ERROR.REFRESH_TOKEN) {
      // `replace`, não `push`: o Back não deve voltar para a tela quebrada.
      router.replace(SESSION_EXPIRED_ROUTE);
    }
  }, [session?.error, exempt, router]);

  return null;
}
