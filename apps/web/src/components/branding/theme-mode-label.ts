import type { ThemeMode } from '@ged/utils';

/** Nome de cada Tema na copy da UI (PT-BR) — "Tema claro", "nos Temas claro e escuro". */
export const THEME_MODE_LABEL: Readonly<Record<ThemeMode, string>> = {
  light: 'claro',
  dark: 'escuro',
};

/** "Tema claro" / "Tema escuro". */
export function themeModeTitle(mode: ThemeMode): string {
  return `Tema ${THEME_MODE_LABEL[mode]}`;
}
