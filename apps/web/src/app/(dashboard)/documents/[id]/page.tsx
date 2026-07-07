import { DocumentDetailPageClient } from './_components/document-detail-page-client';

export default async function DocumentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <DocumentDetailPageClient id={id} />;
}
