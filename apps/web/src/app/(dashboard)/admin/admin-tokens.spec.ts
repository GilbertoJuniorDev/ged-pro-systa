import { readdirSync, readFileSync, statSync } from 'fs';
import { join, relative } from 'path';
import { findRawColorUsages } from '@/lib/raw-color-usages';

/**
 * Escopo da fatia #24 (ADR 0002): área Admin (Aparência, usuários, empresa, configurações,
 * logs de auditoria/erros, departamentos, módulos, permissões) usa só tokens semânticos.
 */
const SRC = join(__dirname, '..', '..', '..');
const SCOPE = ['app/(dashboard)/admin', 'components/admin'];

function collectTsx(path: string): string[] {
  if (statSync(path).isDirectory()) {
    return readdirSync(path).flatMap((entry) => collectTsx(join(path, entry)));
  }
  return path.endsWith('.tsx') && !path.endsWith('.spec.tsx') ? [path] : [];
}

describe('área Admin — tokens semânticos', () => {
  const files = SCOPE.flatMap((entry) => collectTsx(join(SRC, entry)));

  it('encontra os arquivos do escopo', () => {
    expect(files.length).toBeGreaterThan(50);
  });

  it.each(files.map((file) => [relative(SRC, file).replace(/\\/g, '/'), file]))(
    '%s não usa cor crua nem dark:',
    (_name, file) => {
      expect(findRawColorUsages(readFileSync(file, 'utf8'))).toEqual([]);
    },
  );
});
