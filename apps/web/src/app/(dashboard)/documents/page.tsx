import type { Metadata } from 'next';
import { DocumentsPageClient } from './_components/documents-page-client';

export const metadata: Metadata = {
  title: 'Documentos — GED Pro',
};

export default function DocumentsPage() {
  return <DocumentsPageClient />;
}
