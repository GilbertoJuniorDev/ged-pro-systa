import type { NextConfig } from 'next';

// <Logo /> usa next/image contra o binário do logo (system/portal), servido pela API —
// permite explicitamente só esse host + path, nunca um wildcard genérico.
function apiRemotePattern(): NonNullable<NextConfig['images']>['remotePatterns'] {
  const url = process.env.NEXT_PUBLIC_API_URL;
  if (!url) return [];

  try {
    const parsed = new URL(url);
    return [
      {
        protocol: parsed.protocol === 'https:' ? 'https' : 'http',
        hostname: parsed.hostname,
        port: parsed.port || undefined,
        pathname: '/public/appearance/**',
      },
    ];
  } catch {
    return [];
  }
}

const nextConfig: NextConfig = {
  // standalone output é necessário para o Docker; desabilitado localmente
  // pois criar symlinks no Windows requer Developer Mode ou permissão de admin.
  // Para builds Docker, defina NEXT_BUILD_STANDALONE=true.
  ...(process.env.NEXT_BUILD_STANDALONE === 'true' && { output: 'standalone' }),
  images: {
    remotePatterns: apiRemotePattern(),
  },
};

export default nextConfig;
