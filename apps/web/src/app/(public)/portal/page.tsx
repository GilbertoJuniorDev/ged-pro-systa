import type { Metadata } from 'next';
import { PortalPageClient } from './_components/portal-page-client';

export const metadata: Metadata = {
  title: 'Portal de Documentos Públicos — GED Pro',
  description:
    'Consulte, pesquise e baixe documentos públicos disponibilizados pela organização. Alguns arquivos exigem um cadastro rápido antes do download.',
};

export default function PortalPage() {
  return <PortalPageClient />;
}
