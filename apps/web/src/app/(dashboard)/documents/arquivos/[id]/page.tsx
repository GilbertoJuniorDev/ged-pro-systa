import { ArquivoDetailPageClient } from './_components/arquivo-detail-page-client';

export default async function ArquivoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ArquivoDetailPageClient id={id} />;
}
