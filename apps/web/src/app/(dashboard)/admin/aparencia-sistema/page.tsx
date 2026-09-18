import type { Metadata } from 'next';
import { SystemAppearancePageClient } from './_components/system-appearance-page-client';

export const metadata: Metadata = {
  title: 'Aparência do Sistema — GED Pro',
};

export default function SystemAppearancePage() {
  return <SystemAppearancePageClient />;
}
