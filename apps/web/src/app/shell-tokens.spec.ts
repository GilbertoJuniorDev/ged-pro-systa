import { readdirSync, readFileSync, statSync } from 'fs';
import { join, relative } from 'path';
import { findRawColorUsages } from '@/lib/raw-color-usages';

/**
 * Escopo da fatia #21 (ADR 0002): shell autenticado, login, reset de senha, sessão
 * expirada e seleção de departamento usam só tokens semânticos.
 */
const SRC = join(__dirname, '..');
const SCOPE = [
  'app/layout.tsx',
  'app/(dashboard)/layout.tsx',
  'app/(dashboard)/loading.tsx',
  'app/(auth)',
  'app/(department-select)',
  'components/layout',
];

function collectTsx(path: string): string[] {
  if (statSync(path).isDirectory()) {
    return readdirSync(path).flatMap((entry) => collectTsx(join(path, entry)));
  }
  return path.endsWith('.tsx') && !path.endsWith('.spec.tsx') ? [path] : [];
}

describe('shell, login e seleção de departamento — tokens semânticos', () => {
  const files = SCOPE.flatMap((entry) => collectTsx(join(SRC, entry)));

  it.each(files.map((file) => [relative(SRC, file).replace(/\\/g, '/'), file]))(
    '%s não usa cor crua nem dark:',
    (_name, file) => {
      expect(findRawColorUsages(readFileSync(file, 'utf8'))).toEqual([]);
    },
  );
});
