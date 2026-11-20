import { readFileSync } from 'fs';
import { join } from 'path';
import { findRawColorUsages } from '@/lib/raw-color-usages';

/** Escopo da fatia #28 (ADR 0002): o preview de Paleta usa só tokens semânticos. */
const FILES = ['palette-theme-preview.tsx', 'primary-adjustment-warning.tsx'];

describe('preview da Paleta — tokens semânticos', () => {
  it.each(FILES)('%s não usa cor crua nem dark:', (file) => {
    expect(findRawColorUsages(readFileSync(join(__dirname, file), 'utf8'))).toEqual([]);
  });
});
