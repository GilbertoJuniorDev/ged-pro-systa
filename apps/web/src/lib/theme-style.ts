import {
  COLOR_SHADES,
  deriveThemeScales,
  readableForeground,
  type ColorScale,
  type ThemeScales,
} from '@ged/utils';
import { DEFAULT_PORTAL_APPEARANCE, DEFAULT_SYSTEM_APPEARANCE } from '@ged/types';
import type { PortalAppearanceDto, SystemAppearanceDto } from '@/types';

/**
 * Este módulo é o que faz a cor escolhida pelo admin realmente valer no app inteiro.
 *
 * O Tailwind v4 declara seu tema em `@theme default` (NÃO `inline`), então `bg-indigo-600`
 * compila para `background-color: var(--color-indigo-600)`. Redefinir essas variáveis em
 * runtime retinge as ~3.193 ocorrências de `indigo-*`/`slate-*`/`sky-*` do app sem tocar
 * em nenhum componente — é por isso que a correção não exige um refactor de 94 arquivos.
 *
 * Duas regras de cascata sustentam isso e NÃO podem ser afrouxadas:
 *
 * 1. **Nunca envolver o CSS gerado em `@layer`.** O tema do Tailwind vive dentro de
 *    `@layer theme`, e em CSS cascade layers qualquer regra SEM layer vence qualquer regra
 *    COM layer, independentemente de ordem e especificidade. É isso que torna irrelevante
 *    a posição em que o React/Next acaba inserindo a `<style>` no documento.
 * 2. **`:root:root` (0-2-0), não `:root`.** Os aliases estáticos de `globals.css` também
 *    são unlayered e usam `:root` (0-1-0); duplicar o seletor garante a vitória sem
 *    depender da ordem dos arquivos. O bloco do tema claro precisa de `:root:root.light`
 *    (0-3-0) porque `.light` fica no MESMO elemento que `:root` (é o `<html>`).
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

/**
 * CSS do tema do sistema — as 33 paradas de rampa + o foreground da cor primária.
 *
 * `--color-primary-foreground` é o único valor que NÃO é alias de uma parada de rampa:
 * ele depende de contraste (branco ou escuro, conforme a cor primária), então precisa ser
 * calculado. O tema claro ancora a primária em 700, daí o segundo bloco.
 */
export function buildSystemThemeCss(appearance: SystemAppearanceDto): string {
  try {
    return renderSystemCss(appearance);
  } catch {
    return renderSystemCss(DEFAULT_SYSTEM_DTO);
  }
}

function renderSystemCss(appearance: SystemAppearanceDto): string {
  const scales = deriveThemeScales(appearance);

  return (
    `:root:root{${declareAllRamps(scales)}` +
    `--color-primary-foreground:${readableForeground(scales.primary[600])};}` +
    `:root:root.light{--color-primary-foreground:${readableForeground(scales.primary[700])};}`
  );
}

/**
 * CSS do tema do portal — mesmas rampas, mas com escopo no wrapper do portal.
 *
 * O portal compartilha o mesmo documento e o mesmo `:root` do sistema (`(public)` é route
 * group, não cria `<html>` próprio). Sem escopo, o remap global tingiria o portal com a
 * cor do SISTEMA. Custom properties herdam, então redefinir as rampas em `.ged-portal`
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
