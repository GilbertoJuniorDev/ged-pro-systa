import type { Page } from '@playwright/test';

/**
 * Login compartilhado dos e2e. Usa os `data-testid` que `auth.e2e.spec.ts` documenta como
 * contrato da página /login. Credenciais vêm do seed (SEED_ADMIN_EMAIL/SEED_ADMIN_PASSWORD).
 */

export const ADMIN_EMAIL = process.env['SEED_ADMIN_EMAIL'] ?? '';
export const ADMIN_PASSWORD = process.env['SEED_ADMIN_PASSWORD'] ?? '';

export const hasAdminCredentials = ADMIN_EMAIL !== '' && ADMIN_PASSWORD !== '';

export const MISSING_CREDENTIALS_REASON = 'Requer SEED_ADMIN_EMAIL/SEED_ADMIN_PASSWORD no ambiente';

/** Entra como admin e passa pela seleção de departamento ("Visualização Admin"). */
export async function loginAsAdmin(page: Page): Promise<void> {
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
}
