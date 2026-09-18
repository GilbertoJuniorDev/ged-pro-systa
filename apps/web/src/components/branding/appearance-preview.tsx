'use client';

import { deriveThemeScales, readableForeground, type ThemeScales } from '@ged/utils';

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
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Informe cores válidas para ver a pré-visualização.
      </p>
    );
  }

  const shades = SHADES[mode];
  const primary = scales.primary[shades.primary];
  const secondary = scales.secondary[shades.secondary];
  const surface = scales.neutral[shades.surface];
  // No modo claro os cards são brancos (ver globals.css: `.light .bg-slate-900` é #ffffff),
  // então a superfície elevada do preview precisa seguir a mesma regra para não prometer
  // um card tingido que a aplicação não entrega.
  const elevated = mode === 'light' ? '#ffffff' : scales.neutral[shades.elevated];
  const text = scales.neutral[shades.text];

  return (
    <div className="overflow-hidden rounded-xl border" style={{ borderColor: elevated, backgroundColor: surface }}>
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
          style={{ backgroundColor: scales.secondary[mode === 'dark' ? 950 : 50], color: secondary }}
        >
          Destaque secundário
        </div>
      </div>
    </div>
  );
}
