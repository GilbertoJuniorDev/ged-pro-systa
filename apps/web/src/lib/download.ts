const BASE_URL = process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL ?? '';

// The download route sits behind the global JwtAuthGuard, so a plain <a href> can't
// carry the Bearer token. Fetching the blob client-side and triggering a synthetic
// download link is the simplest approach that still works with token-based auth.
export async function downloadFile(path: string, token: string | undefined, filename: string): Promise<void> {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });

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
