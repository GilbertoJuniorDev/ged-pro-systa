'use client';

import { useTheme } from 'next-themes';

/**
 * Theme-aware chart color tokens for Recharts. `fill`/`stroke` props need
 * literal values — Tailwind classes don't apply to SVG attributes — so this
 * module is the single place literal hex values live for dashboard charts.
 *
 * Palette derived and validated per the dataviz skill's method
 * (`node scripts/validate_palette.js`): every slot below passes the
 * lightness band, chroma floor, CVD (Machado-2009) adjacent-pair separation
 * and contrast checks against this app's actual card surfaces
 * (white #ffffff light / slate-900 #0f172a dark).
 */

export interface ChartColorSet {
  readonly indigo: string;
  readonly emerald: string;
  readonly amber: string;
  readonly violet: string;
  readonly rose: string;
  readonly cyan: string;
}

// Fixed categorical hue order (never cycled), matching the app's existing
// indigo/emerald/amber/violet/rose/cyan accent vocabulary. A chart with N
// genuinely distinct series takes slots 1..N of this order in sequence.
const CATEGORICAL_LIGHT: ChartColorSet = {
  indigo: '#4f46e5',
  emerald: '#059669',
  amber: '#d97706',
  violet: '#7c3aed',
  rose: '#e11d48',
  cyan: '#0891b2',
};

const CATEGORICAL_DARK: ChartColorSet = {
  indigo: '#6366f1',
  emerald: '#059669',
  amber: '#d97706',
  violet: '#8b5cf6',
  rose: '#f43f5e',
  cyan: '#0891b2',
};

// Ordinal one-hue ramp (light → dark) for `confidencialidade`: Público <
// Restrito < Confidencial is an ascending sensitivity SCALE, not three
// unrelated identities, so it takes monotone-lightness steps of a single hue
// instead of categorical colors (validated with --ordinal).
export type OrdinalRamp = readonly [string, string, string];

const ORDINAL_LIGHT: OrdinalRamp = ['#a78bfa', '#7c3aed', '#5b21b6'];
const ORDINAL_DARK: OrdinalRamp = ['#c4b5fd', '#8b5cf6', '#6d28d9'];

export interface ChartChrome {
  readonly grid: string;
  readonly axis: string;
  readonly tooltipBg: string;
  readonly tooltipBorder: string;
  readonly tooltipText: string;
}

const CHROME_LIGHT: ChartChrome = {
  grid: '#e2e8f0',
  axis: '#64748b',
  tooltipBg: '#ffffff',
  tooltipBorder: '#e2e8f0',
  tooltipText: '#0f172a',
};

const CHROME_DARK: ChartChrome = {
  grid: '#334155',
  axis: '#94a3b8',
  tooltipBg: '#0f172a',
  tooltipBorder: '#334155',
  tooltipText: '#f1f5f9',
};

export interface ChartPalette {
  readonly categorical: ChartColorSet;
  readonly confidencialidade: OrdinalRamp;
  /** Single hue for magnitude bars/lines (nominal categorical → one series, one hue). */
  readonly sequential: string;
  readonly chrome: ChartChrome;
}

/** Theme-aware chart palette. Defaults to dark when the theme hasn't resolved yet (app is dark-first). */
export function useChartPalette(): ChartPalette {
  const { resolvedTheme } = useTheme();
  const isLight = resolvedTheme === 'light';

  const categorical = isLight ? CATEGORICAL_LIGHT : CATEGORICAL_DARK;

  return {
    categorical,
    confidencialidade: isLight ? ORDINAL_LIGHT : ORDINAL_DARK,
    sequential: categorical.indigo,
    chrome: isLight ? CHROME_LIGHT : CHROME_DARK,
  };
}
