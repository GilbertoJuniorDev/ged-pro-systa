import type { Metadata } from 'next';
import { CompanyPageClient } from './_components/company-page-client';

export const metadata: Metadata = {
  title: 'Empresa — GED Pro',
};

export default function AdminCompanyPage() {
  return <CompanyPageClient />;
}
