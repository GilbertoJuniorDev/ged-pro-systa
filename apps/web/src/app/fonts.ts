import { Plus_Jakarta_Sans } from 'next/font/google';

/**
 * Fonte sans do sistema — ponto único de troca. Expõe `--font-ged-sans`, que o
 * `--font-sans` do Tailwind (globals.css) consome; trocar a família = trocar este import.
 */
export const fontSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-ged-sans',
});
