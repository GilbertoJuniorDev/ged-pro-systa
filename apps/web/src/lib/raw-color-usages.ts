/**
 * Detecta, num trecho de código-fonte, classes Tailwind de cor que o ADR 0002 proíbe
 * em componentes migrados: rampas cruas (`slate-*`, `indigo-*`, `red-*`…), branco/preto
 * literais, valores arbitrários de cor (`bg-[#…]`, `bg-[var(--color-…)]`) e a variante
 * `dark:` — tudo isso deve virar token semântico (`bg-surface`, `text-danger`…).
 *
 * Usado pelos specs de escopo de cada fatia da migração até a regra de lint (#26).
 */

const RAW_PALETTES =
  'slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose';

const COLOR_UTILITIES =
  'bg|text|border(?:-[trblxyse])?|ring(?:-offset)?|outline|divide|from|via|to|fill|stroke|placeholder|shadow|decoration|accent|caret';

const RAW_COLOR_UTILITY = new RegExp(
  `^(?:${COLOR_UTILITIES})-(?:(?:${RAW_PALETTES})-\\d{2,3}|white|black|\\[(?:#|var\\(--color-|rgb|hsl)[^\\]]*\\])(?:\\/\\d+)?$`,
);

const VARIANT_CHAIN = /^((?:[\w-]+:)*)(.+)$/;

function isRawColorClass(token: string): boolean {
  const match = VARIANT_CHAIN.exec(token);
  if (!match) return false;
  const variants = match[1] ?? '';
  const utility = match[2] ?? '';
  if (variants.split(':').includes('dark')) return true;
  return RAW_COLOR_UTILITY.test(utility.replace(/^!/, ''));
}

export function findRawColorUsages(source: string): string[] {
  return source.split(/[\s"'`]+/).filter((token) => token.length > 0 && isRawColorClass(token));
}
