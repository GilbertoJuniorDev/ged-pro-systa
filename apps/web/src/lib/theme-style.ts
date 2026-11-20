import {
  COLOR_SHADES,
  deriveSemanticTokens,
  deriveThemeScales,
  readableForeground,
  SEMANTIC_TOKEN_NAMES,
  type ColorScale,
  type Palette,
  type ThemeMode,
  type ThemeScales,
} from '@ged/utils';
import { DEFAULT_PORTAL_APPEARANCE, DEFAULT_SYSTEM_APPEARANCE } from '@ged/types';
import type { PortalAppearanceDto, SystemAppearanceDto } from '@/types';

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

// Usados só no caminho de erro (cor corrompida no banco): o CSS vai para
// `dangerouslySetInnerHTML`, então cair nos defaults é preferível a emitir lixo.
const DEFAULT_SYSTEM_DTO: SystemAppearanceDto = {
  ...DEFAULT_SYSTEM_APPEARANCE,
  updatedAt: new Date(0).toISOString(),
};

const DEFAULT_PORTAL_DTO: PortalAppearanceDto = {
  ...DEFAULT_PORTAL_APPEARANCE,
  updatedAt: new Date(0).toISOString(),
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
export function buildSystemThemeCss(appearance: SystemAppearanceDto): string {
  try {
    return renderSemanticTokensCss(appearance);
  } catch {
    return renderSemanticTokensCss(DEFAULT_SYSTEM_DTO);
  }
}

/** Prefixo das custom properties dos tokens semânticos — `--ged-primary`, `--ged-surface`… */
export const SEMANTIC_TOKEN_PREFIX = '--ged-';

function declareSemanticTokens(palette: Palette, mode: ThemeMode): string {
  const { tokens } = deriveSemanticTokens(palette, mode);
  return SEMANTIC_TOKEN_NAMES.map((name) => `${SEMANTIC_TOKEN_PREFIX}${name}:${tokens[name]};`).join('');
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
export function buildPortalThemeCss(appearance: PortalAppearanceDto): string {
  try {
    return renderPortalCss(appearance);
  } catch {
    return renderPortalCss(DEFAULT_PORTAL_DTO);
  }
}

function renderPortalCss(appearance: PortalAppearanceDto): string {
  const scales = deriveThemeScales(appearance);

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
