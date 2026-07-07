import type { Metadata } from 'next';
import { UploadPageClient } from './_components/upload-page-client';

export const metadata: Metadata = {
  title: 'Upload de Documento — GED Pro',
};

export default function UploadPage() {
  return <UploadPageClient />;
}
