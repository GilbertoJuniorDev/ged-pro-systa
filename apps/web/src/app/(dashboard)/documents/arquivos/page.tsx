import type { Metadata } from 'next';
import { ArquivosPageClient } from './_components/arquivos-page-client';

export const metadata: Metadata = {
  title: 'Arquivos — GED Pro',
};

export default function ArquivosPage() {
  return <ArquivosPageClient />;
}
