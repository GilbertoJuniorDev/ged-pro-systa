import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // standalone output é necessário para o Docker; desabilitado localmente
  // pois criar symlinks no Windows requer Developer Mode ou permissão de admin.
  // Para builds Docker, defina NEXT_BUILD_STANDALONE=true.
  ...(process.env.NEXT_BUILD_STANDALONE === 'true' && { output: 'standalone' }),
};

export default nextConfig;
