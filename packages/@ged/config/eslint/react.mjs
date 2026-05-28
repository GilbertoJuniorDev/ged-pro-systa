import tseslint from 'typescript-eslint';
import { createBaseConfig } from './base.mjs';

/**
 * Factory que cria o flat config ESLint para pacotes React/TSX.
 * Estende o config base TypeScript com regras React/JSX.
 *
 * @param {string} dirname - passe `import.meta.dirname` do eslint.config.mjs consumidor
 */
export function createReactConfig(dirname) {
  return tseslint.config(...createBaseConfig(dirname), {
    files: ['**/*.tsx', '**/*.jsx'],
    rules: {
      // Prefere tipagem explícita em props de componentes React
      '@typescript-eslint/explicit-function-return-type': 'off',

      // Hooks rules são aplicadas via eslint-plugin-react-hooks no nível do app
      // (Next.js já inclui via eslint-config-next)
    },
  },
  // Overrides para arquivos de teste React — wrapper components anônimos são padrão de teste
  {
    files: ['**/*.spec.tsx', '**/*.spec.ts', '**/*.e2e-spec.tsx'],
    rules: {
      'react/display-name': 'off',
    },
  });
}
