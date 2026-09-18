import type { Metadata } from 'next';
import { SessionExpiredClient } from './_components/session-expired-client';

export const metadata: Metadata = {
  title: 'Sessão expirada — GED Pro',
};

/**
 * Sem `auth()` de propósito: a tela precisa renderizar tanto com a sessão quebrada
 * quanto sem sessão nenhuma — o `signOut` da própria tela zera o cookie no meio do
 * caminho. A isenção correspondente está em `middleware.ts`.
 */
export default function SessaoExpiradaPage() {
  return <SessionExpiredClient />;
}
