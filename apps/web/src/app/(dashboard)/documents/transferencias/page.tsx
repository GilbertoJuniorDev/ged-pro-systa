import type { Metadata } from 'next';
import { TransferenciasPageClient } from './_components/transferencias-page-client';

export const metadata: Metadata = {
  title: 'Transferências — GED Pro',
};

export default function TransferenciasPage() {
  return <TransferenciasPageClient />;
}
