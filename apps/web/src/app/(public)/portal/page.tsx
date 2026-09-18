import type { Metadata } from 'next';
import { getPortalAppearance } from '@/lib/appearance';
import { PortalPageClient } from './_components/portal-page-client';

export const metadata: Metadata = {
  title: 'Portal de Documentos Públicos — GED Pro',
  description:
    'Consulte, pesquise e baixe documentos públicos disponibilizados pela organização. Alguns arquivos exigem um cadastro rápido antes do download.',
};

export default async function PortalPage() {
  // Mesma URL/opções de layout.tsx — deduplicado pelo Data Cache do Next dentro do
  // mesmo request, então isto não dispara uma segunda chamada de rede.
  const appearance = await getPortalAppearance();

  return <PortalPageClient heroTitle={appearance.heroTitle} heroSubtitle={appearance.heroSubtitle} />;
}
