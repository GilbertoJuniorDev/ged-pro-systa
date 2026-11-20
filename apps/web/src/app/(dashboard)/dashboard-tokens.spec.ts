import { readdirSync, readFileSync, statSync } from 'fs';
import { join, relative } from 'path';
import { findRawColorUsages } from '@/lib/raw-color-usages';

/**
 * Escopo da fatia #25 (ADR 0002): dashboard inicial (widgets), Sobre e Configurações
 * (Minha Assinatura) usam só tokens semânticos.
 */
const SRC = join(__dirname, '..', '..');
const SCOPE = [
  'app/(dashboard)/page.tsx',
  'app/(dashboard)/sobre',
  'app/(dashboard)/configuracoes',
  'components/dashboard',
];

function collectTsx(path: string): string[] {
  if (statSync(path).isDirectory()) {
    return readdirSync(path).flatMap((entry) => collectTsx(join(path, entry)));
  }
  return path.endsWith('.tsx') && !path.endsWith('.spec.tsx') ? [path] : [];
}

describe('dashboard, Sobre e Configurações — tokens semânticos', () => {
  const files = SCOPE.flatMap((entry) => collectTsx(join(SRC, entry)));

  it.each(files.map((file) => [relative(SRC, file).replace(/\\/g, '/'), file]))(
    '%s não usa cor crua nem dark:',
    (_name, file) => {
      expect(findRawColorUsages(readFileSync(file, 'utf8'))).toEqual([]);
    },
  );
});
