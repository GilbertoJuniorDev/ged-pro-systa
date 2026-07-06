import { FlatCompat } from '@eslint/eslintrc';
import { fileURLToPath } from 'url';
import path from 'path';
import { createReactConfig } from '@ged/config/eslint/react';

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
];
