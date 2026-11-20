import {
  COLOR_SHADES,
  deriveSemanticTokens,
  deriveThemeScales,
  readableForeground,
  SEMANTIC_TOKEN_NAMES,
  type ColorScale,
  type Palette,
  type SemanticTokenName,
  type SemanticTokens,
  type ThemeMode,
  type ThemeScales,
} from '@ged/utils';
import { DEFAULT_PORTAL_APPEARANCE, DEFAULT_SYSTEM_APPEARANCE } from '@ged/types';

/**
 * CSS de tema injetado em runtime a partir da Aparência salva pelo admin.
 *
 * - **Sistema** (`buildSystemThemeCss`): só os tokens semânticos `--ged-*` (ADR 0002),
 *   derivados de Paleta × Tema. Nenhuma rampa do Tailwind é retingida: fora do portal a
 *   regra de lint `ged/no-raw-color-classes` proíbe rampas cruas.
 * - **Portal** (`buildPortalThemeCss`): ainda no modelo antigo — retinge as rampas
 *   `indigo`/`sky`/`slate` com escopo em `.ged-portal` até o portal migrar para os tokens.
 *
 * Duas regras de cascata sustentam isso e NÃO podem ser afrouxadas:
 *
 * 1. **Nunca envolver o CSS gerado em `@layer`.** O tema do Tailwind vive dentro de
 *    `@layer theme`, e em CSS cascade layers qualquer regra SEM layer vence qualquer regra
 *    COM layer, independentemente de ordem e especificidade. É isso que torna irrelevante
 *    a posição em que o React/Next acaba inserindo a `<style>` no documento.
 * 2. **Especificidade reforçada** (`:root:root`, `.dark.dark`, `.ged-portal.ged-portal`):
 *    vence regras estáticas unlayered de `globals.css` sem depender da ordem dos arquivos.
 */

/** Classe do wrapper do portal — ver `app/(public)/portal/layout.tsx`. */
export const PORTAL_THEME_CLASS = 'ged-portal';

/**
 * Paleta padrão do sistema. Também é o fallback do caminho de erro (cor corrompida no
 * banco): o CSS vai para `dangerouslySetInnerHTML`, então cair nos defaults é preferível a
 * emitir lixo.
 */
export const DEFAULT_SYSTEM_PALETTE: Palette = {
  primaryColor: DEFAULT_SYSTEM_APPEARANCE.primaryColor,
  secondaryColor: DEFAULT_SYSTEM_APPEARANCE.secondaryColor,
  backgroundColor: DEFAULT_SYSTEM_APPEARANCE.backgroundColor,
};

const DEFAULT_PORTAL_PALETTE: Palette = {
  primaryColor: DEFAULT_PORTAL_APPEARANCE.primaryColor,
  secondaryColor: DEFAULT_PORTAL_APPEARANCE.secondaryColor,
  backgroundColor: DEFAULT_PORTAL_APPEARANCE.backgroundColor,
};

const RAMP_PREFIX = {
  primary: '--color-indigo-',
  secondary: '--color-sky-',
  neutral: '--color-slate-',
} as const;

function declareRamp(prefix: string, scale: ColorScale): string {
  return COLOR_SHADES.map((shade) => `${prefix}${shade}:${scale[shade]};`).join('');
}

function declareAllRamps(scales: ThemeScales): string {
  return (
    declareRamp(RAMP_PREFIX.primary, scales.primary) +
    declareRamp(RAMP_PREFIX.secondary, scales.secondary) +
    declareRamp(RAMP_PREFIX.neutral, scales.neutral)
  );
}

/** CSS do tema do sistema — os tokens semânticos `--ged-*` por Tema. */
export function buildSystemThemeCss(palette: Palette): string {
  try {
    return renderSemanticTokensCss(palette);
  } catch {
    return renderSemanticTokensCss(DEFAULT_SYSTEM_PALETTE);
  }
}

/** Prefixo das custom properties dos tokens semânticos — `--ged-primary`, `--ged-surface`… */
export const SEMANTIC_TOKEN_PREFIX = '--ged-';

/**
 * Custom properties `--ged-*` de um conjunto de tokens — serve de CSS ou de estilo inline
 * (`CSSProperties & SemanticTokenVars` aceita as chaves `--*` sem cast).
 */
export type SemanticTokenVars = Readonly<Record<`--${string}`, string>>;

function tokenProperty(name: SemanticTokenName): `--${string}` {
  return `${SEMANTIC_TOKEN_PREFIX}${name}`;
}

/** `var(--ged-<name>)` — para usar um token em código TS (SVG, estilo inline). */
export function tokenVar(name: SemanticTokenName): string {
  return `var(${tokenProperty(name)})`;
}

/** Os tokens como `{ '--ged-primary': '#…', … }`, na ordem de `SEMANTIC_TOKEN_NAMES`. */
export function semanticTokenVars(tokens: SemanticTokens): SemanticTokenVars {
  return Object.fromEntries(SEMANTIC_TOKEN_NAMES.map((name) => [tokenProperty(name), tokens[name]]));
}

function declareSemanticTokens(palette: Palette, mode: ThemeMode): string {
  const vars = semanticTokenVars(deriveSemanticTokens(palette, mode).tokens);
  return Object.entries(vars)
    .map(([property, value]) => `${property}:${value};`)
    .join('');
}

/**
 * Tokens semânticos (ADR 0002) por Tema, com **Tema por trecho da tela**.
 *
 * Os valores são hex literais (sem `var()`) declarados no próprio elemento marcado com
 * `.dark`/`.light`, então cada elemento herda os tokens do ancestral marcado mais próximo —
 * não só do `<html>`. É o que deixa um trecho `.light` (ex.: a Combobox do portal) claro
 * dentro de um `<html class="dark">`, e vice-versa.
 *
 * Especificidade: `:root:root` (0-2-0) é o padrão escuro (antes do next-themes pôr a
 * classe); `:root:root.light` (0-3-0) vence-o no `<html>`; `.dark.dark`/`.light.light`
 * (0-2-0) marcam trechos. Sem `@layer` (ver regras de cascata no topo do arquivo).
 */
function renderSemanticTokensCss(palette: Palette): string {
  return (
    `:root:root,.dark.dark{${declareSemanticTokens(palette, 'dark')}}` +
    `:root:root.light,.light.light{${declareSemanticTokens(palette, 'light')}}`
  );
}

/**
 * CSS do tema do portal — rampas do Tailwind retingidas, com escopo no wrapper do portal.
 *
 * O portal compartilha o mesmo documento e o mesmo `:root` do sistema (`(public)` é route
 * group, não cria `<html>` próprio), então as rampas retingidas têm escopo no wrapper:
 * custom properties herdam, então redefinir as rampas em `.ged-portal`
 * sobrescreve só aquela subárvore — sem `!important` e sem guerra de especificidade.
 *
 * Os aliases `--portal-color-*` são declarados AQUI, e não em `:root`, de propósito:
 * `var()` é resolvido no elemento onde a declaração se aplica e só o valor já resolvido é
 * herdado. Declarados em `:root`, resolveriam contra a rampa do sistema e herdariam esse
 * valor congelado para dentro do portal.
 */
export function buildPortalThemeCss(palette: Palette): string {
  try {
    return renderPortalCss(palette);
  } catch {
    return renderPortalCss(DEFAULT_PORTAL_PALETTE);
  }
}

function renderPortalCss(palette: Palette): string {
  const scales = deriveThemeScales(palette);

  return (
    `.${PORTAL_THEME_CLASS}.${PORTAL_THEME_CLASS}{${declareAllRamps(scales)}` +
    `--portal-color-primary:var(--color-indigo-700);` +
    `--portal-color-primary-hover:var(--color-indigo-800);` +
    `--portal-color-primary-soft:var(--color-indigo-50);` +
    `--portal-color-primary-foreground:${readableForeground(scales.primary[700])};` +
    `--portal-color-secondary:var(--color-sky-600);` +
    `--portal-color-surface:var(--color-slate-50);` +
    `--portal-color-surface-elevated:#ffffff;}`
  );
}
