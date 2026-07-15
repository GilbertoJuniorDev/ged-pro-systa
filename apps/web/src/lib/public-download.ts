const BASE_URL = process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL ?? '';

// Rota pública (sem JwtAuthGuard) — documentos com exigeCadastro=true exigem um token
// emitido por POST /public/documents/:id/acesso, anexado como query string. Diferente de
// download.ts, não há Authorization: Bearer aqui.
export async function downloadPublicFile(
  documentId: string,
  filename: string,
  token?: string,
): Promise<void> {
  const path = `/public/documents/${documentId}/download${token ? `?token=${encodeURIComponent(token)}` : ''}`;
  const response = await fetch(`${BASE_URL}${path}`);

  if (!response.ok) {
    throw new Error('Erro ao baixar o arquivo');
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
