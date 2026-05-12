import type { Metadata } from 'next';
import { PermissoesPageClient } from './_components/permissoes-page-client';

export const metadata: Metadata = {
  title: 'Permissões — GED Pro',
};

export default function AdminPermissoesPage() {
  return <PermissoesPageClient />;
}
