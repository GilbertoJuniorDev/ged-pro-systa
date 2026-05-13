import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { SessionProvider } from 'next-auth/react';
import { auth } from '@/lib/auth';
import { ThemeProvider } from '@/providers/theme-provider';
import { ThemeAwareToaster } from '@/providers/theme-aware-toaster';
import { QueryProvider } from '@/providers/query-provider';
import { NavigationProvider } from '@/providers/navigation-provider';
import { ErrorTrackingProvider } from '@/providers/error-tracking-provider';
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

  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={inter.className}>
        <SessionProvider session={session}>
          <ThemeProvider>
            <QueryProvider>
              <NavigationProvider>{children}</NavigationProvider>
            </QueryProvider>
            <ErrorTrackingProvider />
            <ThemeAwareToaster />
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
