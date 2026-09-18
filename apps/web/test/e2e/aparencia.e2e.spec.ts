import { expect, test } from '@playwright/test';

/**
 * Cobre exatamente o sintoma que originou a correção: o admin troca a cor, salva, recebe
 * o toast de sucesso e **nada muda na tela**.
 *
 * A causa tinha duas metades, e cada teste aqui trava uma delas:
 * 1. as CSS variables geradas não eram lidas por ninguém (o app usa `indigo-*`/`slate-*`
 *    fixos em ~3.193 lugares), então a cor só valia no login e no logo;
 * 2. salvar invalidava só o cache client-side do React Query, nunca o `<style>` que o
 *    RootLayout renderiza no servidor.
 *
 * Requer a stack de dev (`pnpm docker:dev`) e as credenciais de seed em SEED_ADMIN_*.
 */

const ADMIN_EMAIL = process.env['SEED_ADMIN_EMAIL'] ?? '';
const ADMIN_PASSWORD = process.env['SEED_ADMIN_PASSWORD'] ?? '';

/** Cor inconfundível, para nenhuma asserção passar por acidente. */
const TEST_PRIMARY = '#16a34a';

test.describe('Aparência do sistema', () => {
  test.skip(
    ADMIN_EMAIL === '' || ADMIN_PASSWORD === '',
    'Requer SEED_ADMIN_EMAIL/SEED_ADMIN_PASSWORD no ambiente',
  );

  test.beforeEach(async ({ page }) => {
    // Mesmos data-testid que auth.e2e.spec.ts já documenta como contrato da página.
    await page.goto('/login');
    await page.fill('[data-testid="email"]', ADMIN_EMAIL);
    await page.fill('[data-testid="password"]', ADMIN_PASSWORD);
    await page.click('[data-testid="submit"]');
    await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 30_000 });

    // Admin cai em /selecionar-departamento antes do dashboard; "Visualização Admin"
    // é o atalho que ignora o escopo de departamento.
    const adminView = page.getByRole('button', { name: /visualização admin/i });
    if (await adminView.isVisible().catch(() => false)) {
      await adminView.click();
      await page.waitForURL((url) => !url.pathname.includes('selecionar-departamento'), {
        timeout: 30_000,
      });
    }
  });

  test('a cor primária salva vale nas classes indigo do app inteiro', async ({ page }) => {
    await page.goto('/admin/aparencia-sistema');

    // O ColorField renderiza <input type="color"> + <input type="text"> sob o mesmo
    // <label>; o de texto é o que aceita o hex digitado.
    await page
      .locator('label', { hasText: 'Cor primária' })
      .locator('input[type="text"]')
      .fill(TEST_PRIMARY);
    await page.getByRole('button', { name: /salvar cores/i }).click();
    await expect(page.getByText(/cores do sistema atualizadas/i)).toBeVisible();

    // Sem recarregar: é este o passo que falhava antes da correção.
    await expect
      .poll(
        () =>
          page.evaluate(() =>
            getComputedStyle(document.documentElement).getPropertyValue('--color-indigo-600').trim(),
          ),
        { timeout: 15_000 },
      )
      .toBe(TEST_PRIMARY);
  });

  test('a rampa inteira é retingida, não só a parada âncora', async ({ page }) => {
    await page.goto('/admin/aparencia-sistema');

    const shades = await page.evaluate(() => {
      const root = getComputedStyle(document.documentElement);
      return [50, 100, 400, 600, 900, 950].map((s) =>
        root.getPropertyValue(`--color-indigo-${s}`).trim(),
      );
    });

    expect(shades.every((s) => /^#[0-9a-f]{6}$/i.test(s))).toBe(true);
    expect(new Set(shades).size).toBe(shades.length);
  });

  test('o portal mantém tema próprio mesmo compartilhando o documento', async ({ page }) => {
    await page.goto('/portal');

    const { root, portal } = await page.evaluate(() => {
      const wrapper = document.querySelector('.ged-portal');
      return {
        root: getComputedStyle(document.documentElement)
          .getPropertyValue('--color-indigo-600')
          .trim(),
        portal:
          wrapper === null
            ? null
            : getComputedStyle(wrapper).getPropertyValue('--color-indigo-600').trim(),
      };
    });

    expect(portal).not.toBeNull();
    // O portal é independente: a cor do sistema não pode vazar para dentro dele.
    expect(portal).not.toBe(root);
  });
});
