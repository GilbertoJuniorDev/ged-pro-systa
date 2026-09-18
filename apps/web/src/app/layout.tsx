import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { SessionProvider } from 'next-auth/react';
import { auth } from '@/lib/auth';
import { ThemeProvider } from '@/providers/theme-provider';
import { ThemeAwareToaster } from '@/providers/theme-aware-toaster';
import { QueryProvider } from '@/providers/query-provider';
import { NavigationProvider } from '@/providers/navigation-provider';
import { ErrorTrackingProvider } from '@/providers/error-tracking-provider';
import { SessionExpiryProvider } from '@/providers/session-expiry-provider';
import { getSystemAppearance } from '@/lib/appearance';
import { SystemAppearanceProvider } from '@/providers/appearance-provider';
import { buildSystemThemeCss } from '@/lib/theme-style';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'GED Pro',
  description: 'Sistema de Gerenciamento Eletrônico de Documentos',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const appearance = await getSystemAppearance();
  const themeCss = buildSystemThemeCss(appearance);

  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        {/* Renderizado no servidor, antes do primeiro paint — evita FOUC ao trocar a
            cor do sistema. Ver lib/appearance.ts (fetch) e lib/theme-style.ts (CSS). */}
        <style id="ged-theme-vars" dangerouslySetInnerHTML={{ __html: themeCss }} />
      </head>
      <body className={inter.className}>
        <SessionProvider session={session}>
          <ThemeProvider>
            <QueryProvider>
              {/* Semeia o cache do React Query com a aparência que já buscamos acima --
                  sem isto o <Logo /> do sidebar refaz a mesma chamada no browser. */}
              <SystemAppearanceProvider appearance={appearance}>
                <NavigationProvider>{children}</NavigationProvider>
              </SystemAppearanceProvider>
            </QueryProvider>
            <SessionExpiryProvider />
            <ErrorTrackingProvider />
            <ThemeAwareToaster />
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
