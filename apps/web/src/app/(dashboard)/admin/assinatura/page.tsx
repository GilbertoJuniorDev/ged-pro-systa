import type { Metadata } from 'next';
import { SubscriptionAdminPageClient } from './_components/subscription-admin-page-client';

export const metadata: Metadata = {
  title: 'Assinatura — GED Pro',
};

export default function AdminSubscriptionPage() {
  return <SubscriptionAdminPageClient />;
}
