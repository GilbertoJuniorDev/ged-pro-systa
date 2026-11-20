'use client';

import {
  COLOR_SHADES,
  contrastRatio,
  deriveThemeScales,
  readableForeground,
  type ColorScale,
  type ThemeScales,
} from '@ged/utils';

interface AppearancePreviewProps {
  readonly primaryColor: string;
  readonly secondaryColor: string;
  readonly backgroundColor: string;
  /** Qual variante mostrar — o admin segue o tema ativo, o portal é claro fixo. */
  readonly mode: 'dark' | 'light';
}

/**
 * Paradas que cada modo realmente usa em tela — as mesmas que `lib/theme-style.ts` injeta
 * e que `globals.css` aliasa. Manter este mapa alinhado com aqueles dois é o que faz a
 * pré-visualização mostrar o que o app vai de fato renderizar, e não uma segunda
 * derivação parecida (era esse o problema da versão anterior).
 */
const SHADES = {
  dark: { primary: 600, surface: 950, elevated: 900, text: 50, secondary: 500 },
  light: { primary: 700, surface: 50, elevated: 100, text: 900, secondary: 600 },
} as const;

const AA_CONTRAST = 4.5;

/**
 * Primeira parada da rampa, a partir de `from` e andando na direção do contraste (para o
 * claro no modo escuro, para o escuro no claro), que atinge 4.5:1 sobre `background`.
 * Sem nenhuma, cai no texto legível (branco/escuro) — o destaque nunca reprova no axe.
 */
function readableShade(
  scale: ColorScale,
  from: number,
  background: string,
  mode: 'dark' | 'light',
): string {
  const shades =
    mode === 'dark'
      ? COLOR_SHADES.filter((shade) => shade <= from).reverse()
      : COLOR_SHADES.filter((shade) => shade >= from);
  const found = shades.find((shade) => contrastRatio(scale[shade], background) >= AA_CONTRAST);
  return found === undefined ? readableForeground(background) : scale[found];
}

export function AppearancePreview({
  primaryColor,
  secondaryColor,
  backgroundColor,
  mode,
}: AppearancePreviewProps) {
  let scales: ThemeScales | null = null;

  try {
    scales = deriveThemeScales({ primaryColor, secondaryColor, backgroundColor });
  } catch {
    scales = null;
  }

  if (!scales) {
    return (
      <p className="text-sm text-muted-foreground">
        Informe cores válidas para ver a pré-visualização.
      </p>
    );
  }

  const shades = SHADES[mode];
  const primary = scales.primary[shades.primary];
  const surface = scales.neutral[shades.surface];
  // No modo claro os cards são brancos (ver globals.css: `.light .bg-slate-900` é #ffffff),
  // então a superfície elevada do preview precisa seguir a mesma regra para não prometer
  // um card tingido que a aplicação não entrega.
  const elevated = mode === 'light' ? '#ffffff' : scales.neutral[shades.elevated];
  const text = scales.neutral[shades.text];
  const secondaryBackground = scales.secondary[mode === 'dark' ? 950 : 50];
  const secondary = readableShade(scales.secondary, shades.secondary, secondaryBackground, mode);

  return (
    <div
      className="overflow-hidden rounded-xl border"
      style={{ borderColor: elevated, backgroundColor: surface }}
    >
      <div className="flex items-center gap-2 px-4 py-3" style={{ backgroundColor: elevated }}>
        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: primary }} />
        <span className="text-sm font-semibold" style={{ color: text }}>
          GED Pro
        </span>
      </div>
      <div className="p-4">
        <button
          type="button"
          className="w-full rounded-lg px-3 py-2 text-sm font-medium"
          style={{ backgroundColor: primary, color: readableForeground(primary) }}
        >
          Botão primário
        </button>
        <div
          className="mt-2 rounded-lg px-3 py-2 text-center text-sm font-medium"
          style={{ backgroundColor: secondaryBackground, color: secondary }}
        >
          Destaque secundário
        </div>
      </div>
    </div>
  );
}
