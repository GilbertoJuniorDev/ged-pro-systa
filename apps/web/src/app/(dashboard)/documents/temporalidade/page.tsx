import type { Metadata } from 'next';
import { TemporalidadePageClient } from './_components/temporalidade-page-client';

export const metadata: Metadata = {
  title: 'Temporalidade — GED Pro',
};

export default function TemporalidadePage() {
  return <TemporalidadePageClient />;
}
