import type { Metadata } from 'next';
import { PortalAppearancePageClient } from './_components/portal-appearance-page-client';

export const metadata: Metadata = {
  title: 'Aparência do Portal — GED Pro',
};

export default function PortalAppearancePage() {
  return <PortalAppearancePageClient />;
}
