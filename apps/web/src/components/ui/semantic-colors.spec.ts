import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { findRawColorUsages } from '@/lib/raw-color-usages';

/**
 * ADR 0002 — a UI compartilhada (`components/ui`) colore tudo por tokens semânticos
 * (Paleta × Tema): sem rampas cruas, branco/preto, cores arbitrárias nem `dark:`.
 */

const UI_DIR = __dirname;

function componentFiles(): string[] {
  return readdirSync(UI_DIR)
    .filter((f) => f.endsWith('.tsx') && !f.endsWith('.spec.tsx'))
    .sort();
}

describe('components/ui — tokens semânticos', () => {
  it('encontra os componentes compartilhados', () => {
    expect(componentFiles()).toEqual(expect.arrayContaining(['combobox.tsx', 'date-picker.tsx']));
  });

  it.each(componentFiles())('%s não usa cor crua nem dark:', (file) => {
    expect(findRawColorUsages(readFileSync(join(UI_DIR, file), 'utf8'))).toEqual([]);
  });
});
