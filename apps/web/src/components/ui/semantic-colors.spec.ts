import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * ADR 0002 — a UI compartilhada colore tudo por tokens semânticos (Paleta × Tema).
 * Nenhum componente de `components/ui` pode usar rampas cruas (neutro/marca/status),
 * hex, aliases legados `var(--color-*)` nem a variante `dark:`.
 */

const UI_DIR = __dirname;

const RAW_PALETTE =
  'slate|gray|zinc|neutral|stone|indigo|sky|blue|violet|purple|fuchsia|pink|red|rose|orange|amber|yellow|lime|green|emerald|teal|cyan|white|black';

const FORBIDDEN: ReadonlyArray<{ readonly name: string; readonly pattern: RegExp }> = [
  { name: 'variante dark:', pattern: /(?<![\w-])dark:/g },
  {
    name: 'rampa crua',
    pattern: new RegExp(`(?<![\\w-])[a-z-]+-(?:${RAW_PALETTE})(?:-\\d{2,3})?(?:/\\d+)?(?![\\w-])`, 'g'),
  },
  { name: 'hex', pattern: /#[0-9a-fA-F]{3,8}\b/g },
  { name: 'alias legado', pattern: /var\(--color-/g },
];

function componentFiles(): string[] {
  return readdirSync(UI_DIR)
    .filter((f) => f.endsWith('.tsx') && !f.endsWith('.spec.tsx'))
    .sort();
}

function violationsIn(file: string): string[] {
  const source = readFileSync(join(UI_DIR, file), 'utf8');
  return FORBIDDEN.flatMap(({ name, pattern }) =>
    [...source.matchAll(pattern)].map((m) => `${name}: ${m[0]}`),
  );
}

describe('components/ui — tokens semânticos', () => {
  it('encontra os componentes compartilhados', () => {
    expect(componentFiles()).toEqual(expect.arrayContaining(['combobox.tsx', 'date-picker.tsx']));
  });

  it.each(componentFiles())('%s não usa cor crua nem dark:', (file) => {
    expect(violationsIn(file)).toEqual([]);
  });
});
