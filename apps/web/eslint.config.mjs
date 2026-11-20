import { FlatCompat } from '@eslint/eslintrc';
import { fileURLToPath } from 'url';
import path from 'path';
import { createReactConfig } from '@ged/config/eslint/react';
import rawColorClasses from './eslint-rules/raw-color-classes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({ baseDirectory: __dirname });

export default [
  ...createReactConfig(__dirname),
  ...compat.extends('next/core-web-vitals'),
  // Override para arquivos de teste — deve vir DEPOIS do next/core-web-vitals para ter precedência
  {
    files: ['**/*.spec.tsx', '**/*.spec.ts', '**/*.e2e-spec.tsx'],
    rules: {
      'react/display-name': 'off',
    },
  },
  // ADR 0002 — cor só por token semântico (Paleta × Tema). Proíbe rampas cruas do Tailwind
  // (neutro, marca e status), branco/preto, cores arbitrárias (hex/rgb/hsl/--color-*) e a
  // variante `dark:`. Specs ficam de fora (fixtures com classes cruas de propósito).
  // Portal público: ainda no modelo antigo (rampas retingidas em .ged-portal) — sai
  // desta exceção quando migrar para os tokens.
  {
    files: ['src/**/*.ts', 'src/**/*.tsx'],
    ignores: ['src/app/(public)/portal/**', '**/*.spec.ts', '**/*.spec.tsx'],
    plugins: { ged: { rules: { 'no-raw-color-classes': rawColorClasses.rawColorClassesRule } } },
    rules: { 'ged/no-raw-color-classes': 'error' },
  },
];
