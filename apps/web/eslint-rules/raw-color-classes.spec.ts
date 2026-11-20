/**
 * @jest-environment node
 */
import { RuleTester } from 'eslint';
import * as tsParser from '@typescript-eslint/parser';

import { findRawColorUsages, rawColorClassesRule } from './raw-color-classes';

describe('findRawColorUsages', () => {
  it('aceita utilities de token semântico', () => {
    const source = `<div className="bg-surface text-foreground border-border hover:bg-primary-hover bg-danger/10 ring-ring" />`;
    expect(findRawColorUsages(source)).toEqual([]);
  });

  it('acusa rampas cruas de neutro e marca', () => {
    expect(findRawColorUsages('className="bg-slate-900 text-indigo-400 border-sky-500/50"')).toEqual([
      'bg-slate-900',
      'text-indigo-400',
      'border-sky-500/50',
    ]);
  });

  it('acusa cores de status cruas, inclusive sob variantes', () => {
    expect(findRawColorUsages('"text-red-500 hover:bg-emerald-50 group-hover:text-amber-700"')).toEqual([
      'text-red-500',
      'hover:bg-emerald-50',
      'group-hover:text-amber-700',
    ]);
  });

  it('acusa cores cruas sob variantes com valor arbitrário ou nome de grupo', () => {
    expect(
      findRawColorUsages('"[&>svg]:text-slate-500 data-[state=open]:bg-indigo-50 group-hover/row:text-rose-600"'),
    ).toEqual([
      '[&>svg]:text-slate-500',
      'data-[state=open]:bg-indigo-50',
      'group-hover/row:text-rose-600',
    ]);
  });

  it('acusa a variante dark:', () => {
    expect(findRawColorUsages('"bg-surface dark:bg-surface"')).toEqual(['dark:bg-surface']);
  });

  it('acusa branco/preto literais e valores arbitrários de cor (hex, rgb, hsl, --color-*)', () => {
    expect(
      findRawColorUsages(
        '"text-white bg-black/50 bg-[#4f46e5] text-[var(--color-primary)] border-[rgb(0,0,0)] fill-[hsl(0,0%,0%)]"',
      ),
    ).toEqual([
      'text-white',
      'bg-black/50',
      'bg-[#4f46e5]',
      'text-[var(--color-primary)]',
      'border-[rgb(0,0,0)]',
      'fill-[hsl(0,0%,0%)]',
    ]);
  });

  it('não confunde texto comum com classe de cor', () => {
    expect(findRawColorUsages('// redirecionar para o dashboard; tema escuro (dark mode)')).toEqual([]);
    expect(findRawColorUsages('#4f46e5')).toEqual([]);
  });
});

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

ruleTester.run('no-raw-color-classes', rawColorClassesRule, {
  valid: [
    { code: '<div className="bg-surface text-foreground hover:bg-foreground/5" />' },
    { code: "const cls = cn('bg-primary text-primary-foreground', ok && 'ring-1 ring-success/40');" },
    { code: 'const tpl = `rounded ${active ? "bg-primary-soft text-primary" : "text-muted-foreground"}`;' },
    // Hex como VALOR (input type=color, placeholder) não é classe.
    { code: '<input type="color" value="#000000" placeholder="#4f46e5" />' },
    { code: '// bg-slate-900 num comentário não é classe\nconst x = 1;' },
  ],
  invalid: [
    {
      code: '<div className="bg-slate-900 text-white" />',
      errors: [
        { messageId: 'rawColor', data: { token: 'bg-slate-900' } },
        { messageId: 'rawColor', data: { token: 'text-white' } },
      ],
    },
    {
      code: "const cls = cn('rounded', active && 'dark:bg-surface');",
      errors: [{ messageId: 'rawColor', data: { token: 'dark:bg-surface' } }],
    },
    {
      code: 'const tpl = `p-2 ${x ? "text-emerald-600" : ""} hover:bg-[#fff]`;',
      errors: [
        { messageId: 'rawColor', data: { token: 'text-emerald-600' } },
        { messageId: 'rawColor', data: { token: 'hover:bg-[#fff]' } },
      ],
    },
  ],
});
