'use client';

import type { CSSProperties } from 'react';
import {
  deriveSemanticTokens,
  SEMANTIC_TOKEN_NAMES,
  THEME_MODES,
  type DerivedTheme,
  type Palette,
  type ThemeMode,
} from '@ged/utils';
import { SEMANTIC_TOKEN_PREFIX } from '@/lib/theme-style';
import { PrimaryAdjustmentWarning } from './primary-adjustment-warning';

interface PaletteThemePreviewProps {
  /** Paleta em edição — o preview acompanha cada mudança do formulário. */
  readonly palette: Palette;
}

const MODE_TITLE: Readonly<Record<ThemeMode, string>> = {
  light: 'Tema claro',
  dark: 'Tema escuro',
};

const STATUS_SAMPLES = [
  { label: 'Sucesso', className: 'ring-success/40 text-success' },
  { label: 'Atenção', className: 'ring-warning/40 text-warning' },
  { label: 'Erro', className: 'ring-danger/40 text-danger' },
  { label: 'Info', className: 'ring-info/40 text-info' },
] as const;

type DerivedThemes = Readonly<Record<ThemeMode, DerivedTheme>>;

/** `null` quando alguma cor ainda não é `#RRGGBB` (o admin está digitando). */
function deriveBothThemes(palette: Palette): DerivedThemes | null {
  try {
    return {
      light: deriveSemanticTokens(palette, 'light'),
      dark: deriveSemanticTokens(palette, 'dark'),
    };
  } catch {
    return null;
  }
}

/**
 * Os tokens derivados viram `--ged-*` inline no painel. Estilo inline vence a regra global
 * `.light.light`/`.dark.dark` (theme-style.ts), então o painel mostra a Paleta EM EDIÇÃO,
 * não a salva — e as classes semânticas de dentro resolvem contra esses valores.
 */
function tokensAsStyle({ tokens }: DerivedTheme): CSSProperties {
  const style: Record<string, string> = {};
  for (const name of SEMANTIC_TOKEN_NAMES) style[`${SEMANTIC_TOKEN_PREFIX}${name}`] = tokens[name];
  return style as CSSProperties;
}

function ThemePanel({ mode, theme }: { readonly mode: ThemeMode; readonly theme: DerivedTheme }) {
  const title = MODE_TITLE[mode];

  return (
    <div
      role="group"
      aria-label={title}
      className={`${mode} rounded-xl border border-border bg-background p-3 text-foreground`}
      style={tokensAsStyle(theme)}
    >
      <p className="mb-2 text-xs font-semibold text-muted-foreground">{title}</p>
      <div className="space-y-3 rounded-lg border border-border bg-surface p-3">
        <div>
          <p className="text-sm font-semibold text-foreground">GED Pro</p>
          <p className="text-xs text-muted-foreground">Texto de apoio</p>
        </div>
        <button
          type="button"
          tabIndex={-1}
          className="w-full rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground"
        >
          Botão primário
        </button>
        <div className="flex flex-wrap gap-1.5">
          <span className="rounded-md bg-primary-soft px-2 py-0.5 text-xs font-medium text-primary">
            Selecionado
          </span>
          <span className="rounded-md px-2 py-0.5 text-xs font-medium text-secondary ring-1 ring-inset ring-secondary/40">
            Secundária
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {STATUS_SAMPLES.map((sample) => (
            <span
              key={sample.label}
              className={`rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${sample.className}`}
            >
              {sample.label}
            </span>
          ))}
        </div>
        <div className="rounded-lg border border-border bg-surface-elevated px-3 py-2 text-xs text-foreground shadow-sm">
          Menu suspenso
        </div>
      </div>
    </div>
  );
}

/**
 * Pré-visualização da Paleta nos dois Temas (claro e escuro), lado a lado, com o aviso de
 * primária ajustada. Usa a mesma derivação que o app aplica (`deriveSemanticTokens`).
 */
export function PaletteThemePreview({ palette }: PaletteThemePreviewProps) {
  const themes = deriveBothThemes(palette);

  if (!themes) {
    return (
      <p className="text-sm text-muted-foreground">
        Informe cores válidas para ver a pré-visualização.
      </p>
    );
  }

  const adjustedModes = THEME_MODES.filter((mode) => themes[mode].primaryAdjusted);

  return (
    <div className="space-y-3">
      <PrimaryAdjustmentWarning adjustedModes={adjustedModes} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1">
        {THEME_MODES.map((mode) => (
          <ThemePanel key={mode} mode={mode} theme={themes[mode]} />
        ))}
      </div>
    </div>
  );
}
