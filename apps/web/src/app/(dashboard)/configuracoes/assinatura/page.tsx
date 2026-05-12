import type { Metadata } from 'next';
import { UserSubscriptionPageClient } from './_components/user-subscription-page-client';

export const metadata: Metadata = {
  title: 'Minha Assinatura — GED Pro',
};

export default function UserSubscriptionPage() {
  return <UserSubscriptionPageClient />;
}
