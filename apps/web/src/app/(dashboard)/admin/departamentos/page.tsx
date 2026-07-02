import type { Metadata } from 'next';
import { DepartamentosPageClient } from './_components/departamentos-page-client';

export const metadata: Metadata = {
  title: 'Departamentos — GED Pro',
};

export default function AdminDepartamentosPage() {
  return <DepartamentosPageClient />;
}
