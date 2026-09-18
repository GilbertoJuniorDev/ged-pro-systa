const HEX_PATTERN = /^#[0-9A-Fa-f]{6}$/;

function assertValidHex(hex: string): void {
  if (!HEX_PATTERN.test(hex)) {
    throw new Error(`Cor inválida: "${hex}" (esperado formato #RRGGBB)`);
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

interface Hsl {
  readonly h: number;
  readonly s: number;
  readonly l: number;
}

/** Converte #RRGGBB para HSL (h em graus 0-360, s/l em percentual 0-100) */
export function hexToHsl(hex: string): Hsl {
  assertValidHex(hex);

  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  let h = 0;
  if (delta !== 0) {
    if (max === r) h = ((g - b) / delta) % 6;
    else if (max === g) h = (b - r) / delta + 2;
    else h = (r - g) / delta + 4;
  }
  h = ((h * 60) + 360) % 360;

  const l = (max + min) / 2;
  const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));

  // Sem arredondar aqui: h/s/l ficam em ponto flutuante para que o roundtrip
  // hexToHsl -> hslToHex preserve a cor original (arredondar cedo perde precisão
  // que se acumula nos 3 canais RGB na conversão de volta).
  return { h, s: s * 100, l: l * 100 };
}

/** Converte HSL (h 0-360, s/l 0-100) para #RRGGBB */
export function hslToHex(h: number, s: number, l: number): string {
  const sat = clamp(s, 0, 100) / 100;
  const lig = clamp(l, 0, 100) / 100;

  const c = (1 - Math.abs(2 * lig - 1)) * sat;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = lig - c / 2;

  let [r, g, b] = [0, 0, 0];
  const hh = ((h % 360) + 360) % 360;

  if (hh < 60) [r, g, b] = [c, x, 0];
  else if (hh < 120) [r, g, b] = [x, c, 0];
  else if (hh < 180) [r, g, b] = [0, c, x];
  else if (hh < 240) [r, g, b] = [0, x, c];
  else if (hh < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];

  const toHex = (channel: number): string => {
    const v = Math.round((channel + m) * 255);
    return clamp(v, 0, 255).toString(16).padStart(2, '0');
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function srgbChannelToLinear(channel: number): number {
  return channel <= 0.03928 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4);
}

/** Luminância relativa (WCAG 2.x) de uma cor #RRGGBB */
export function relativeLuminance(hex: string): number {
  assertValidHex(hex);
  const r = srgbChannelToLinear(parseInt(hex.slice(1, 3), 16) / 255);
  const g = srgbChannelToLinear(parseInt(hex.slice(3, 5), 16) / 255);
  const b = srgbChannelToLinear(parseInt(hex.slice(5, 7), 16) / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Razão de contraste (WCAG 2.x) entre duas cores #RRGGBB — sempre >= 1 */
export function contrastRatio(hexA: string, hexB: string): number {
  const lA = relativeLuminance(hexA);
  const lB = relativeLuminance(hexB);
  const lighter = Math.max(lA, lB);
  const darker = Math.min(lA, lB);
  return (lighter + 0.05) / (darker + 0.05);
}

const WCAG_AA_CONTRAST = 4.5;
const FOREGROUND_LIGHT = '#ffffff';
const FOREGROUND_DARK = '#0f172a';

/**
 * Escolhe branco ou um escuro de referência como cor de texto sobre `hex`, priorizando
 * contraste AA (4.5:1). Quando nenhum dos dois atinge AA (cores de luminância
 * intermediária), devolve o de maior contraste — o melhor possível para aquela cor.
 */
export function readableForeground(hex: string): string {
  const contrastWithLight = contrastRatio(hex, FOREGROUND_LIGHT);
  const contrastWithDark = contrastRatio(hex, FOREGROUND_DARK);

  if (contrastWithLight >= WCAG_AA_CONTRAST) return FOREGROUND_LIGHT;
  if (contrastWithDark >= WCAG_AA_CONTRAST) return FOREGROUND_DARK;
  return contrastWithLight >= contrastWithDark ? FOREGROUND_LIGHT : FOREGROUND_DARK;
}

// ─── Rampas de cor ──────────────────────────────────────────────────────────
// O app inteiro usa as classes `indigo-*`, `sky-*` e `slate-*` do Tailwind (~3.193
// ocorrências). Como o Tailwind v4 declara o tema em `@theme default` (NÃO `inline`),
// `bg-indigo-600` compila para `var(--color-indigo-600)` — então redefinir essas
// variáveis em runtime retinge o app inteiro sem tocar em nenhum componente.
// Estas tabelas são a referência dessa substituição.

export const COLOR_SHADES = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;
export type ColorShade = (typeof COLOR_SHADES)[number];
export type ColorScale = Readonly<Record<ColorShade, string>>;

/**
 * `anchor` re-escala a rampa em torno da cor escolhida; `preserve` mantém a escada de
 * luminosidade da referência intacta e só troca matiz/saturação.
 */
export type ScaleLightnessMode = 'anchor' | 'preserve';

export interface ColorScaleOptions {
  readonly reference?: ColorScale;
  readonly lightness?: ScaleLightnessMode;
  /** Teto para o fator de saturação — o neutro usa 1 (nunca mais colorido que o slate). */
  readonly maxSaturationRatio?: number;
  /**
   * Ajusta a luminosidade final para que a **luminância relativa (WCAG)** de cada parada
   * case com a da referência. Sem isto, girar o matiz mantendo o L do HSL muda a
   * luminância — os canais pesam 0.2126/0.7152/0.0722, então um vermelho e um azul de
   * mesmo L têm luminâncias bem diferentes. Usado no neutro (ver `deriveThemeScales`).
   */
  readonly matchReferenceLuminance?: boolean;
}

export const TAILWIND_INDIGO_SCALE: ColorScale = {
  50: '#eef2ff',
  100: '#e0e7ff',
  200: '#c7d2fe',
  300: '#a5b4fc',
  400: '#818cf8',
  500: '#6366f1',
  600: '#4f46e5',
  700: '#4338ca',
  800: '#3730a3',
  900: '#312e81',
  950: '#1e1b4b',
};

export const TAILWIND_SKY_SCALE: ColorScale = {
  50: '#f0f9ff',
  100: '#e0f2fe',
  200: '#bae6fd',
  300: '#7dd3fc',
  400: '#38bdf8',
  500: '#0ea5e9',
  600: '#0284c7',
  700: '#0369a1',
  800: '#075985',
  900: '#0c4a6e',
  950: '#082f49',
};

export const TAILWIND_SLATE_SCALE: ColorScale = {
  50: '#f8fafc',
  100: '#f1f5f9',
  200: '#e2e8f0',
  300: '#cbd5e1',
  400: '#94a3b8',
  500: '#64748b',
  600: '#475569',
  700: '#334155',
  800: '#1e293b',
  900: '#0f172a',
  950: '#020617',
};

const LIGHTEST_SHADE = 50;
const DARKEST_SHADE = 950;
/** Distância mínima de luminosidade entre a âncora e cada ponta, para a rampa nunca colapsar. */
const MIN_LIGHTNESS_SPAN = 6;
const MAX_LIGHTNESS = 98;
const MIN_LIGHTNESS = 4;

/** Precisão da busca binária de luminância — bem abaixo do passo de 1/255 de um canal. */
const LUMINANCE_EPSILON = 1e-4;
const LUMINANCE_SEARCH_STEPS = 24;

function normalizeHue(hue: number): number {
  return ((hue % 360) + 360) % 360;
}

/**
 * Acha o L (0-100) cuja cor `hsl(hue, saturation, L)` tem a luminância relativa alvo.
 * A luminância cresce monotonicamente com L para h/s fixos, então a busca binária é
 * válida. Devolve o candidato original quando ele já casa — o que mantém a identidade
 * exata com a referência quando nada precisa ser corrigido.
 */
function solveLightnessForLuminance(
  hue: number,
  saturation: number,
  seedLightness: number,
  targetLuminance: number,
): string {
  const seed = hslToHex(hue, saturation, seedLightness);
  if (Math.abs(relativeLuminance(seed) - targetLuminance) <= LUMINANCE_EPSILON) return seed;

  let low = 0;
  let high = 100;
  let best = seed;

  for (let i = 0; i < LUMINANCE_SEARCH_STEPS; i += 1) {
    const mid = (low + high) / 2;
    best = hslToHex(hue, saturation, mid);
    const luminance = relativeLuminance(best);

    if (Math.abs(luminance - targetLuminance) <= LUMINANCE_EPSILON) return best;
    if (luminance < targetLuminance) low = mid;
    else high = mid;
  }

  return best;
}

/** Constrói o Record completo sem `as` — cada parada é escrita explicitamente. */
function buildScale(resolve: (shade: ColorShade) => string): ColorScale {
  return {
    50: resolve(50),
    100: resolve(100),
    200: resolve(200),
    300: resolve(300),
    400: resolve(400),
    500: resolve(500),
    600: resolve(600),
    700: resolve(700),
    800: resolve(800),
    900: resolve(900),
    950: resolve(950),
  };
}

/**
 * Deriva as 11 paradas de uma rampa Tailwind a partir de 1 cor, ancorando-a no shade de
 * referência (ex.: `#16a34a` em 600 devolve uma rampa cujo 600 é exatamente `#16a34a`).
 *
 * Os três eixos são tratados separadamente porque têm papéis diferentes:
 * - **matiz**: preserva o *drift* da referência (o indigo vai de 272° a 281° ao longo da
 *   rampa) aplicando o mesmo offset relativo sobre a cor escolhida;
 * - **saturação**: proporcional à âncora, nunca absoluta — a referência já tem a curva de
 *   croma certa (pontas menos saturadas que o meio) e a proporção a preserva;
 * - **luminosidade**: em `anchor`, re-escala cada metade da rampa de forma independente,
 *   mantendo a posição relativa de cada parada intermediária.
 */
export function deriveColorScale(
  hex: string,
  anchor: ColorShade,
  options: ColorScaleOptions = {},
): ColorScale {
  assertValidHex(hex);

  const reference = options.reference ?? TAILWIND_INDIGO_SCALE;
  const mode = options.lightness ?? 'anchor';

  const picked = hexToHsl(hex);
  const refAnchor = hexToHsl(reference[anchor]);

  // Saturação ABSOLUTA seria métrica ruim aqui: slate-950 (#020617) tem s≈84% em HSL e
  // ainda é praticamente preto — o que o torna escuro é o L, não o S. Por isso o fator é
  // proporcional, e o teto (1, no neutro) garante croma nunca acima do slate original.
  const saturationRatio = Math.min(
    refAnchor.s === 0 ? 1 : picked.s / refAnchor.s,
    options.maxSaturationRatio ?? Number.POSITIVE_INFINITY,
  );

  const refLightestL = hexToHsl(reference[LIGHTEST_SHADE]).l;
  const refDarkestL = hexToHsl(reference[DARKEST_SHADE]).l;

  // A cor escolhida entra SEM clamp: `deriveColorScale('#16a34a', 600)[600]` é exatamente
  // `#16a34a`. Limitar a luminosidade aqui devolveria ao admin uma cor diferente da que ele
  // escolheu — e é desnecessário, porque a legibilidade do texto sobre a cor é resolvida
  // por `readableForeground`, e as pontas da rampa já têm clamp próprio logo abaixo.
  const anchorL = mode === 'preserve' ? refAnchor.l : picked.l;
  const delta = anchorL - refAnchor.l;

  // As pontas são deslocadas junto com a âncora, respeitando um vão mínimo — mas o vão é
  // um DESEJO, não um piso: quando a âncora já está colada no topo (branco puro) ou no
  // fundo (preto puro) não há espaço para ele. O `Math.max`/`Math.min` final contra
  // `anchorL` é o que impede a ponta de ultrapassar a âncora e inverter a rampa.
  const lightEnd = Math.max(
    anchorL,
    Math.min(MAX_LIGHTNESS, Math.max(refLightestL + delta, anchorL + MIN_LIGHTNESS_SPAN)),
  );
  const darkEnd = Math.min(
    anchorL,
    Math.max(MIN_LIGHTNESS, Math.min(refDarkestL + delta, anchorL - MIN_LIGHTNESS_SPAN)),
  );

  // Fatores calculados uma vez: quando a cor escolhida É a âncora da referência ambos
  // valem exatamente 1 (divisão de valores idênticos), de modo que a rampa devolvida é a
  // própria referência — a propriedade de identidade verificada em theme.spec.ts.
  const lightSpan = refLightestL - refAnchor.l;
  const darkSpan = refAnchor.l - refDarkestL;
  const lightFactor = lightSpan > 0 ? (lightEnd - anchorL) / lightSpan : 0;
  const darkFactor = darkSpan > 0 ? (anchorL - darkEnd) / darkSpan : 0;

  return buildScale((shade) => {
    const refShade = hexToHsl(reference[shade]);
    const hue = normalizeHue(picked.h + (refShade.h - refAnchor.h));
    const saturation = clamp(refShade.s * saturationRatio, 0, 100);

    let lightness: number;
    if (mode === 'preserve') {
      lightness = refShade.l;
    } else if (refShade.l > refAnchor.l) {
      lightness = anchorL + (refShade.l - refAnchor.l) * lightFactor;
    } else {
      lightness = anchorL - (refAnchor.l - refShade.l) * darkFactor;
    }

    const clampedLightness = clamp(lightness, 0, 100);

    if (options.matchReferenceLuminance === true) {
      return solveLightnessForLuminance(
        hue,
        saturation,
        clampedLightness,
        relativeLuminance(reference[shade]),
      );
    }

    return hslToHex(hue, saturation, clampedLightness);
  });
}

export interface ThemeScales {
  readonly primary: ColorScale;
  readonly secondary: ColorScale;
  readonly neutral: ColorScale;
}

export interface ThemeScalesInput {
  readonly primaryColor: string;
  readonly secondaryColor: string;
  readonly backgroundColor: string;
}

/**
 * Paradas em que cada cor configurada pelo admin é ancorada — batem 1:1 com os defaults
 * atuais: #4f46e5 = indigo-600, #0ea5e9 = sky-500, #0f172a = slate-900.
 */
export const PRIMARY_ANCHOR_SHADE = 600;
export const SECONDARY_ANCHOR_SHADE = 500;
export const NEUTRAL_ANCHOR_SHADE = 900;

/**
 * Converte as 3 cores do admin nas 3 rampas que o runtime injeta como CSS variables.
 *
 * O neutro é o caso delicado: a rampa slate carrega texto, borda E superfície ao mesmo
 * tempo, então a escada de luminância *é* o sistema de contraste do app — mexer nela
 * moveria todos os pares texto/fundo de uma vez. Por isso ele combina três restrições:
 * `preserve` (não re-escala a escada), teto de saturação 1 (nunca mais colorido que o
 * slate) e `matchReferenceLuminance` (corrige o L para casar a luminância WCAG da
 * referência, já que girar o matiz a altera). O efeito líquido é um tingimento puro, com
 * contraste idêntico ao do slate por construção — não por tentativa e erro.
 */
export function deriveThemeScales(input: ThemeScalesInput): ThemeScales {
  return {
    primary: deriveColorScale(input.primaryColor, PRIMARY_ANCHOR_SHADE, {
      reference: TAILWIND_INDIGO_SCALE,
    }),
    secondary: deriveColorScale(input.secondaryColor, SECONDARY_ANCHOR_SHADE, {
      reference: TAILWIND_SKY_SCALE,
    }),
    neutral: deriveColorScale(input.backgroundColor, NEUTRAL_ANCHOR_SHADE, {
      reference: TAILWIND_SLATE_SCALE,
      lightness: 'preserve',
      maxSaturationRatio: 1,
      matchReferenceLuminance: true,
    }),
  };
}
