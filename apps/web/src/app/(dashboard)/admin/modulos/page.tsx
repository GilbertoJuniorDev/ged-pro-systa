import type { Metadata } from 'next';
import { ModulosPageClient } from './_components/modulos-page-client';

export const metadata: Metadata = {
  title: 'Módulos — GED Pro',
};

export default function AdminModulosPage() {
  return <ModulosPageClient />;
}
