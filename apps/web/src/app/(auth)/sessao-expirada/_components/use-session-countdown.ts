'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { signOut } from 'next-auth/react';
import { LOGIN_ROUTE } from '@/lib/session-expiry';

interface UseSessionCountdownResult {
  readonly secondsLeft: number;
  readonly isRedirecting: boolean;
  readonly redirectNow: () => void;
}

/**
 * Contagem regressiva da tela de sessão expirada. Ao zerar — ou quando `redirectNow`
 * é chamado — encerra a sessão e navega para o login.
 */
export function useSessionCountdown(seconds: number): UseSessionCountdownResult {
  const [secondsLeft, setSecondsLeft] = useState<number>(seconds);
  const [isRedirecting, setIsRedirecting] = useState<boolean>(false);
  // Sobrevive ao double-invoke de efeitos do StrictMode em dev e ao clique no botão
  // acontecendo no mesmo tick em que a contagem zera.
  const hasRedirectedRef = useRef<boolean>(false);

  const redirectNow = useCallback((): void => {
    if (hasRedirectedRef.current) return;
    hasRedirectedRef.current = true;
    setIsRedirecting(true);

    // `signOut` e NÃO `router.push`: o cookie de sessão ainda existe e ainda decodifica.
    // Um push para /login deixaria o cookie morto vivo — o middleware o trataria como
    // sessão válida e devolveria o usuário para `/`, que redireciona de volta para cá.
    // `signOut` faz POST /api/auth/signout, limpa o cookie, e só então navega.
    void signOut({ callbackUrl: LOGIN_ROUTE });
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((current) => (current > 0 ? current - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (secondsLeft === 0) {
      redirectNow();
    }
  }, [secondsLeft, redirectNow]);

  return { secondsLeft, isRedirecting, redirectNow };
}
