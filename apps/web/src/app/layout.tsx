import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'GED Systa',
  description: 'Sistema de Gerenciamento Eletrônico de Documentos',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
