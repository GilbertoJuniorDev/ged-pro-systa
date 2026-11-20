import { findRawColorUsages } from './raw-color-usages';

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

  it('acusa a variante dark:', () => {
    expect(findRawColorUsages('"bg-surface dark:bg-surface"')).toEqual(['dark:bg-surface']);
  });

  it('acusa branco/preto literais e valores arbitrários de cor', () => {
    expect(
      findRawColorUsages('"text-white bg-black/50 bg-[#4f46e5] text-[var(--color-primary)]"'),
    ).toEqual(['text-white', 'bg-black/50', 'bg-[#4f46e5]', 'text-[var(--color-primary)]']);
  });

  it('não confunde texto comum com classe de cor', () => {
    expect(findRawColorUsages('// redirecionar para o dashboard; tema escuro (dark mode)')).toEqual([]);
  });
});
