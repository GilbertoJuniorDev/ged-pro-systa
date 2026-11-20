import type { ThemeMode } from '@ged/utils';

/**
 * Parte pura do harness de verificação visual (sem Playwright), para ser testável no Jest.
 * Ver `visual-check.ts` para o lado que dirige o navegador. Os Temas percorridos são
 * `THEME_MODES` de @ged/utils (claro, depois escuro).
 */

export interface VisualScreen {
  /** Usado nos nomes dos arquivos gerados (`<name>--<tema>.png`). */
  name: string;
  path: string;
  requiresAuth: boolean;
}

export interface AxeViolationLike {
  id: string;
  impact?: string | null;
  help: string;
  nodes: { target: unknown[] }[];
}

export interface ViolationSummary {
  rule: string;
  impact: string | null;
  help: string;
  count: number;
  targets: string[];
}

function screenName(path: string): string {
  const slug = path
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
  return slug === '' ? 'home' : slug;
}

function splitRoutes(raw: string): string[] {
  return raw
    .split(',')
    .map((route) => route.trim())
    .filter((route) => route !== '');
}

/** Converte as listas de rotas (separadas por vírgula) em telas nomeadas. */
export function parseScreens(publicRoutes: string, authRoutes: string): VisualScreen[] {
  return [
    ...splitRoutes(publicRoutes).map((path) => ({
      name: screenName(path),
      path,
      requiresAuth: false,
    })),
    ...splitRoutes(authRoutes).map((path) => ({
      name: screenName(path),
      path,
      requiresAuth: true,
    })),
  ];
}

export function screenshotFileName(screen: string, theme: ThemeMode): string {
  return `${screen}--${theme}.png`;
}

/** Resume o resultado do axe em algo legível no relatório (uma linha por regra). */
export function summarizeViolations(violations: AxeViolationLike[]): ViolationSummary[] {
  return violations.map((violation) => ({
    rule: violation.id,
    impact: violation.impact ?? null,
    help: violation.help,
    count: violation.nodes.length,
    targets: violation.nodes.map((node) => node.target.map(String).join(' ')),
  }));
}
