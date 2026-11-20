import { expect, test, type Page } from '@playwright/test';
import {
  deriveSemanticTokens,
  SEMANTIC_TOKEN_NAMES,
  THEME_MODES,
  type Palette,
  type ThemeMode,
} from '@ged/utils';

import { hasAdminCredentials, loginAsAdmin, MISSING_CREDENTIALS_REASON } from './support/login';

/**
 * ADR 0002: a área autenticada é colorida pelos tokens semânticos `--ged-*`, derivados da
 * Paleta (Aparência do Sistema) combinada com o Tema do usuário. Estes testes verificam
 * isso no navegador, usando a derivação de `@ged/utils` como fonte da verdade:
 *
 * 1. os tokens do `<html>` são os da Paleta salva, nos dois Temas (somente leitura);
 * 2. salvar uma nova primária troca os tokens sem recarregar (o `<style>` do RootLayout é
 *    revalidado) — MUTA o banco de dev e devolve a cor original no `finally`;
 * 3. o portal continua no tema próprio (rampas retingidas em `.ged-portal`).
 *
 * Requer a stack de dev (`pnpm docker:dev`) e as credenciais de seed em SEED_ADMIN_*.
 */

const SYSTEM_PAGE = '/admin/aparencia-sistema';
const PORTAL_PAGE = '/admin/aparencia-portal';
const HEX = /^#[0-9a-f]{6}$/i;

/** Cor inconfundível, para nenhuma asserção passar por acidente. */
const TEST_PRIMARY = '#16a34a';

const FIELD = {
  primaryColor: 'Cor primária',
  secondaryColor: 'Cor secundária',
  backgroundColor: 'Cor de fundo',
} as const;

/** O ColorField tem <input type="color"> + <input type="text"> sob o mesmo <label>. */
function colorInput(page: Page, label: string) {
  return page.locator('label', { hasText: label }).locator('input[type="text"]');
}

async function readColor(page: Page, label: string): Promise<string> {
  const input = colorInput(page, label);
  await expect(input).toHaveValue(HEX, { timeout: 15_000 });
  return (await input.inputValue()).toLowerCase();
}

/** A Paleta salva, como o formulário de Aparência do Sistema a carrega. */
async function savedSystemPalette(page: Page): Promise<Palette> {
  await page.goto(SYSTEM_PAGE);
  return {
    primaryColor: await readColor(page, FIELD.primaryColor),
    secondaryColor: await readColor(page, FIELD.secondaryColor),
    backgroundColor: await readColor(page, FIELD.backgroundColor),
  };
}

async function useTheme(page: Page, theme: ThemeMode): Promise<void> {
  await page.evaluate((t) => window.localStorage.setItem('theme', t), theme);
  await page.reload();
  await expect
    .poll(() => page.evaluate((t) => document.documentElement.classList.contains(t), theme))
    .toBe(true);
}

/** Tokens `--ged-*` efetivos no `<html>`. */
function tokensOnRoot(page: Page): Promise<Record<string, string>> {
  return page.evaluate((names) => {
    const root = getComputedStyle(document.documentElement);
    return Object.fromEntries(
      names.map((name) => [name, root.getPropertyValue(`--ged-${name}`).trim().toLowerCase()]),
    );
  }, [...SEMANTIC_TOKEN_NAMES]);
}

async function savePrimary(page: Page, color: string): Promise<void> {
  await colorInput(page, FIELD.primaryColor).fill(color);
  await page.getByRole('button', { name: /salvar cores/i }).click();
  await expect(page.getByText(/cores do sistema atualizadas/i).first()).toBeVisible();
}

test.describe('Aparência do sistema', () => {
  test.skip(!hasAdminCredentials, MISSING_CREDENTIALS_REASON);

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('os tokens semânticos seguem a Paleta salva nos dois Temas', async ({ page }) => {
    const palette = await savedSystemPalette(page);

    for (const theme of THEME_MODES) {
      await useTheme(page, theme);
      expect(await tokensOnRoot(page), `tokens no Tema ${theme}`).toEqual(
        deriveSemanticTokens(palette, theme).tokens,
      );
    }
  });

  test('a primária salva vale nos tokens dos dois Temas sem recarregar', async ({ page }) => {
    const original = await savedSystemPalette(page);
    const changed: Palette = { ...original, primaryColor: TEST_PRIMARY };

    try {
      await savePrimary(page, TEST_PRIMARY);

      // Sem recarregar: o <style> do RootLayout precisa ter sido revalidado.
      const current: ThemeMode = (await page.evaluate(() =>
        document.documentElement.classList.contains('light'),
      ))
        ? 'light'
        : 'dark';
      await expect
        .poll(async () => (await tokensOnRoot(page))['primary'], { timeout: 15_000 })
        .toBe(deriveSemanticTokens(changed, current).tokens.primary);

      for (const theme of THEME_MODES) {
        await useTheme(page, theme);
        expect(await tokensOnRoot(page), `tokens no Tema ${theme}`).toEqual(
          deriveSemanticTokens(changed, theme).tokens,
        );
      }
    } finally {
      await page.goto(SYSTEM_PAGE);
      if ((await readColor(page, FIELD.primaryColor)) !== original.primaryColor) {
        await savePrimary(page, original.primaryColor);
      }
    }
  });

  test('o portal mantém tema próprio mesmo compartilhando o documento', async ({ page }) => {
    await page.goto(PORTAL_PAGE);
    const portalPrimary = await readColor(page, FIELD.primaryColor);

    await page.goto('/portal');
    const anchor = await page.evaluate(() => {
      const wrapper = document.querySelector('.ged-portal');
      return wrapper === null
        ? null
        : getComputedStyle(wrapper).getPropertyValue('--color-indigo-600').trim().toLowerCase();
    });

    // A rampa do portal é retingida com a cor do PORTAL, no wrapper — não com a do sistema.
    expect(anchor).toBe(portalPrimary);
  });
});
