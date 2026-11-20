import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

import { THEME_MODES, type ThemeMode } from '@ged/utils';

import { hasAdminCredentials, loginAsAdmin, MISSING_CREDENTIALS_REASON } from './login';
import {
  screenshotFileName,
  summarizeViolations,
  type ViolationSummary,
  type VisualScreen,
} from './visual-screens';

/**
 * Harness de verificação visual (ADR 0002): para cada tela, nos dois Temas, tira screenshot
 * de página inteira e roda o axe (regra `color-contrast`). Violações viram relatório, não
 * falha — a menos que VISUAL_STRICT=1. Como rodar: ver `test/e2e/VISUAL.md`.
 */

export const VISUAL_OUT_DIR =
  process.env['VISUAL_OUT_DIR'] ?? path.resolve(__dirname, '../../../visual-results');

const STRICT = process.env['VISUAL_STRICT'] === '1';

/** Chave do localStorage que o next-themes lê (default dele; o ThemeProvider não muda). */
const THEME_STORAGE_KEY = 'theme';

const NEXT_DEV_OVERLAY = 'nextjs-portal';

export interface ScreenThemeResult {
  screen: string;
  path: string;
  theme: ThemeMode;
  screenshot: string;
  violations: ViolationSummary[];
}

/** Aplica o Tema via localStorage e recarrega a rota, como se o usuário tivesse escolhido. */
async function openInTheme(page: Page, route: string, theme: ThemeMode): Promise<void> {
  await page.goto(route);
  await page.evaluate(([key, value]) => window.localStorage.setItem(key, value), [
    THEME_STORAGE_KEY,
    theme,
  ] as const);
  await page.reload();
  await page.waitForLoadState('networkidle').catch(() => undefined);
  // next-themes (attribute="class") põe o Tema como classe do <html>.
  await expect
    .poll(() => page.evaluate((t) => document.documentElement.classList.contains(t), theme))
    .toBe(true);
}

/** Screenshot + axe de uma tela num Tema. Grava `<tela>--<tema>.png` e `.axe.json` em outDir. */
export async function checkScreenInTheme(
  page: Page,
  screen: VisualScreen,
  theme: ThemeMode,
  outDir: string = VISUAL_OUT_DIR,
): Promise<ScreenThemeResult> {
  await openInTheme(page, screen.path, theme);

  // O indicador de dev do Next (<nextjs-portal>) não é parte da UI: fora do print e do axe.
  await page.addStyleTag({ content: `${NEXT_DEV_OVERLAY} { display: none !important; }` });

  const screenshot = path.join(outDir, screenshotFileName(screen.name, theme));
  await page.screenshot({ path: screenshot, fullPage: true, animations: 'disabled' });

  const axe = await new AxeBuilder({ page })
    .withRules(['color-contrast'])
    .exclude(NEXT_DEV_OVERLAY)
    .analyze();
  const result: ScreenThemeResult = {
    screen: screen.name,
    path: screen.path,
    theme,
    screenshot,
    violations: summarizeViolations(axe.violations),
  };
  writeFileSync(
    screenshot.replace(/\.png$/, '.axe.json'),
    JSON.stringify(result, null, 2),
    'utf-8',
  );
  return result;
}

function writeMarkdownReport(outDir: string): void {
  const results = readdirSync(outDir)
    .filter((file) => file.endsWith('.axe.json'))
    .sort()
    .map((file) => JSON.parse(readFileSync(path.join(outDir, file), 'utf-8')) as ScreenThemeResult);

  const lines = [
    '# Relatório visual — contraste (axe)',
    '',
    '| Tela | Rota | Tema | Violações de contraste (nós) |',
    '| --- | --- | --- | --- |',
    ...results.map(
      (r) =>
        `| ${r.screen} | \`${r.path}\` | ${r.theme} | ${r.violations.reduce((n, v) => n + v.count, 0)} |`,
    ),
    '',
  ];
  for (const r of results.filter((x) => x.violations.length > 0)) {
    lines.push(`## ${r.screen} — ${r.theme}`, '');
    for (const v of r.violations) {
      lines.push(`- **${v.rule}** (${v.impact ?? 'n/a'}, ${v.count}): ${v.help}`);
      for (const target of v.targets) lines.push(`  - \`${target}\``);
    }
    lines.push('');
  }
  writeFileSync(path.join(outDir, 'report.md'), lines.join('\n'), 'utf-8');
}

/**
 * Registra um teste por tela, cobrindo os dois Temas. Telas com `requiresAuth` entram como
 * admin via `loginAsAdmin` (e são puladas sem SEED_ADMIN_*). Rode com `--workers=1`: o
 * relatório agregado (`report.md`) é escrito no afterAll a partir dos `.axe.json`.
 */
export function defineVisualSuite(screens: VisualScreen[], outDir: string = VISUAL_OUT_DIR): void {
  test.describe('Verificação visual (Temas claro e escuro)', () => {
    test.beforeAll(() => {
      rmSync(outDir, { recursive: true, force: true });
      mkdirSync(outDir, { recursive: true });
    });

    test.afterAll(() => {
      writeMarkdownReport(outDir);
    });

    for (const screen of screens) {
      test(`${screen.name} (${screen.path})`, async ({ page }, testInfo) => {
        test.skip(screen.requiresAuth && !hasAdminCredentials, MISSING_CREDENTIALS_REASON);
        test.setTimeout(90_000);

        if (screen.requiresAuth) await loginAsAdmin(page);

        for (const theme of THEME_MODES) {
          const result = await checkScreenInTheme(page, screen, theme, outDir);
          await testInfo.attach(screenshotFileName(screen.name, theme), {
            path: result.screenshot,
            contentType: 'image/png',
          });
          const nodes = result.violations.reduce((n, v) => n + v.count, 0);
          testInfo.annotations.push({
            type: `contraste ${theme}`,
            description: `${nodes} nó(s) com violação`,
          });
          if (STRICT) {
            expect.soft(result.violations, `contraste em ${screen.name} (${theme})`).toEqual([]);
          }
        }
      });
    }
  });
}
