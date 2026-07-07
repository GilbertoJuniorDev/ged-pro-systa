import type { Metadata } from 'next';
import { ClassificacaoPageClient } from './_components/classificacao-page-client';

export const metadata: Metadata = {
  title: 'Classificação — GED Pro',
};

export default function ClassificacaoPage() {
  return <ClassificacaoPageClient />;
}
