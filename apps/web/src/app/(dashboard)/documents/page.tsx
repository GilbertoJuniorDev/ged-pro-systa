import type { Metadata } from 'next';
import { Suspense } from 'react';
import { DocumentsPageClient } from './_components/documents-page-client';
import DocumentsLoading from './loading';

export const metadata: Metadata = {
  title: 'Documentos — GED Pro',
};

export default function DocumentsPage() {
  return (
    <Suspense fallback={<DocumentsLoading />}>
      <DocumentsPageClient />
    </Suspense>
  );
}
