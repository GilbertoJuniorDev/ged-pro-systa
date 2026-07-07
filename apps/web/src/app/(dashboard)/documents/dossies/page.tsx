import type { Metadata } from 'next';
import { DossiesPageClient } from './_components/dossies-page-client';

export const metadata: Metadata = {
  title: 'Dossiês — GED Pro',
};

export default function DossiesPage() {
  return <DossiesPageClient />;
}
