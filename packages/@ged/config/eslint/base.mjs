import tseslint from 'typescript-eslint';

/**
 * Factory que cria o flat config ESLint base para todos os pacotes TypeScript.
 * Recebe o dirname do pacote consumidor para que o typed linting resolva o tsconfig correto.
 *
 * @param {string} dirname - passe `import.meta.dirname` do eslint.config.mjs consumidor
 */
export function createBaseConfig(dirname) {
  return tseslint.config(
    ...tseslint.configs.recommended,
    {
      languageOptions: {
        parserOptions: {
          project: true,
          tsconfigRootDir: dirname,
        },
      },
      rules: {
        // Proibido `any` — usar `unknown` + type narrowing
        '@typescript-eslint/no-explicit-any': 'error',

        // `import type` obrigatório para importações de apenas tipos
        '@typescript-eslint/consistent-type-imports': [
          'error',
          { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
        ],

        // Proibido `!` non-null assertion
        '@typescript-eslint/no-non-null-assertion': 'error',

        // `??` no lugar de `||` para cobrir null/undefined
        '@typescript-eslint/prefer-nullish-coalescing': 'error',

        // `as T` sem prova: apenas quando o compilador não consegue inferir
        '@typescript-eslint/consistent-type-assertions': [
          'error',
          { assertionStyle: 'as', objectLiteralTypeAssertions: 'never' },
        ],

        // `interface` para shapes; `type` para unions/intersections/aliases
        '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],

        // Proibido tipos primitivos largos: Function, Object, {}
        '@typescript-eslint/no-unsafe-function-type': 'error',
        '@typescript-eslint/no-wrapper-object-types': 'error',

        // Variáveis não utilizadas (prefixo `_` exclui da regra)
        '@typescript-eslint/no-unused-vars': [
          'error',
          {
            vars: 'all',
            args: 'after-used',
            argsIgnorePattern: '^_',
            varsIgnorePattern: '^_',
            caughtErrorsIgnorePattern: '^_',
          },
        ],

        // Proibido `enum` nativo — usar `const object + as const + typeof`
        'no-restricted-syntax': [
          'error',
          {
            selector: 'TSEnumDeclaration',
            message:
              'Proibido usar enum nativo. Use `const ROLE = { ... } as const` + `type Role = typeof ROLE[keyof typeof ROLE]`.',
          },
        ],
      },
    },
    // Overrides para arquivos de teste — padrões de mock requerem flexibilidade
    {
      files: ['**/*.spec.ts', '**/*.e2e-spec.ts', '**/test/**/*.ts'],
      rules: {
        // `{} as MockType` é padrão legítimo em testes (mocking parcial de dependências)
        '@typescript-eslint/consistent-type-assertions': 'off',
        // `!` permitido em setup de testes (beforeEach) conforme copilot-instructions
        '@typescript-eslint/no-non-null-assertion': 'off',
      },
    },
  );
}
