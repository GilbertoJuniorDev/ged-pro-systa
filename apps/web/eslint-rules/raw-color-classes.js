// @ts-check
/**
 * ADR 0002 — fora do portal público, toda cor da interface vem de token semântico
 * (`bg-surface`, `text-danger`, `ring-ring`…), derivado de Paleta × Tema. Este módulo
 * detecta o que o modelo antigo usava e que não pode voltar:
 *
 * - rampas cruas do Tailwind, de neutro, marca e status (`slate-*`, `indigo-*`, `red-*`…);
 * - branco/preto literais (`text-white`, `bg-black/50`);
 * - cores arbitrárias (`bg-[#4f46e5]`, `text-[var(--color-primary)]`, `rgb(…)`, `hsl(…)`);
 * - a variante `dark:` — os tokens já trocam por Tema, e `dark:` ignora o Tema por trecho.
 *
 * CommonJS de propósito: é carregado tanto por `eslint.config.mjs` (regra
 * `ged/no-raw-color-classes`) quanto pelo Jest (spec ao lado).
 */

const RAW_PALETTES =
  'slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose';

const COLOR_UTILITIES =
  'bg|text|border(?:-[trblxyse])?|ring(?:-offset)?|outline|divide|from|via|to|fill|stroke|placeholder|shadow|decoration|accent|caret';

const RAW_COLOR_UTILITY = new RegExp(
  `^(?:${COLOR_UTILITIES})-(?:(?:${RAW_PALETTES})-\\d{2,3}|white|black|\\[(?:#|var\\(--color-|rgb|hsl)[^\\]]*\\])(?:\\/\\d+)?$`,
);

/** Cadeia de variantes: `hover:`, `group-hover/row:`, `data-[state=open]:`, `[&>svg]:`… */
const VARIANT_CHAIN = /^((?:[\w-]*(?:\[[^\]]*\])?(?:\/[\w-]+)?:)*)(.+)$/;

/** @param {string} token */
function isRawColorClass(token) {
  const match = VARIANT_CHAIN.exec(token);
  if (!match) return false;
  const variants = match[1] ?? '';
  const utility = match[2] ?? '';
  if (variants.split(':').includes('dark')) return true;
  return RAW_COLOR_UTILITY.test(utility.replace(/^!/, ''));
}

/**
 * Classes de cor proibidas encontradas num trecho de texto (código-fonte ou string de classes).
 * @param {string} source
 * @returns {string[]}
 */
function findRawColorUsages(source) {
  return source.split(/[\s"'`]+/).filter((token) => token.length > 0 && isRawColorClass(token));
}

/** @type {import('eslint').Rule.RuleModule} */
const rawColorClassesRule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Proíbe classes de cor cruas do Tailwind (rampas, branco/preto, cores arbitrárias) e a variante dark: — use os tokens semânticos (ADR 0002).',
    },
    schema: [],
    messages: {
      rawColor:
        "Classe de cor crua '{{token}}': use um token semântico (bg-surface, text-foreground, text-muted-foreground, border-border, bg-primary, text-danger…) — ver ADR 0002.",
    },
  },
  create(context) {
    /**
     * @param {import('eslint').Rule.Node} node
     * @param {string} text
     */
    function check(node, text) {
      for (const token of findRawColorUsages(text)) {
        context.report({ node, messageId: 'rawColor', data: { token } });
      }
    }

    return {
      Literal(node) {
        if (typeof node.value === 'string') check(node, node.value);
      },
      TemplateElement(node) {
        check(node, node.value.cooked ?? node.value.raw);
      },
    };
  },
};

module.exports = { findRawColorUsages, rawColorClassesRule };
