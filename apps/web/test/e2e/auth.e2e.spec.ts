/**
 * Testes E2E — Autenticação (Playwright)
 *
 * ⚠️  ESQUELETO — todos os testes marcados com `test.fixme` enquanto
 *     as páginas do frontend ainda são TODO (placeholder).
 *
 * Para ativar um teste, remova o `test.fixme` correspondente e implemente
 * a página de acordo com os `data-testid` documentados abaixo.
 *
 * ─── data-testid esperados ────────────────────────────────────────────────
 *
 *   Página /login
 *     [data-testid="email"]         → <input type="email" />
 *     [data-testid="password"]      → <input type="password" />
 *     [data-testid="submit"]        → <button type="submit" />
 *     [data-testid="error-message"] → <p> ou <div> com mensagem de erro
 *
 *   Dashboard /
 *     [data-testid="user-menu"]     → elemento com nome/avatar do usuário logado
 *     [data-testid="logout-button"] → botão ou link de logout
 *
 * ─── Usuário de teste ─────────────────────────────────────────────────────
 *
 *   Email:    admin@ged.local
 *   Senha:    Admin@12345
 *   Role:     ADMIN
 *
 *   Criado pelo admin.seed.ts em NODE_ENV=development.
 *   Para rodar E2E com backend real, o ambiente deve ter o seed executado.
 *
 * ─── Como rodar ───────────────────────────────────────────────────────────
 *
 *   # Inicia o servidor antes (ou use webServer no playwright.config.ts)
 *   pnpm --filter=web dev
 *
 *   # Roda os testes
 *   pnpm --filter=web test:e2e
 *
 *   # Modo UI interativo
 *   pnpm --filter=web test:e2e --ui
 */
import { test, expect, type Page } from '@playwright/test';

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function fillLoginForm(
  page: Page,
  email: string,
  password: string,
): Promise<void> {
  await page.fill('[data-testid="email"]', email);
  await page.fill('[data-testid="password"]', password);
  await page.click('[data-testid="submit"]');
}

// ─── Jornada A: login com credenciais válidas ─────────────────────────────────

test.describe('Autenticação — jornadas E2E', () => {
  test.fixme(
    'Jornada A — login válido redireciona para /dashboard',
    async ({ page }) => {
      await page.goto('/login');
      await fillLoginForm(page, 'admin@ged.local', 'Admin@12345');

      // Após login bem-sucedido, deve redirecionar para o dashboard
      await expect(page).toHaveURL('/');
      await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
    },
  );

  // ─── Jornada B: login com credenciais inválidas ──────────────────────────

  test.fixme(
    'Jornada B — credenciais inválidas exibem mensagem de erro',
    async ({ page }) => {
      await page.goto('/login');
      await fillLoginForm(page, 'admin@ged.local', 'senha-errada-1');

      // Deve permanecer na página de login e exibir mensagem de erro
      await expect(page).toHaveURL('/login');
      await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
      await expect(page.locator('[data-testid="error-message"]')).not.toBeEmpty();
    },
  );

  // ─── Jornada C: acesso direto a rota protegida sem autenticação ──────────

  test.fixme(
    'Jornada C — acesso a /dashboard sem login redireciona para /login',
    async ({ page }) => {
      // Acessa diretamente o dashboard sem estar autenticado
      await page.goto('/');

      // Deve ser redirecionado para o login
      await expect(page).toHaveURL('/login');
    },
  );

  // ─── Jornada D: ciclo completo login → uso → logout ──────────────────────

  test.fixme(
    'Jornada D — login → acessa dashboard → logout → volta ao /login',
    async ({ page }) => {
      // 1. Login
      await page.goto('/login');
      await fillLoginForm(page, 'admin@ged.local', 'Admin@12345');
      await expect(page).toHaveURL('/');

      // 2. Verificar que está autenticado
      await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();

      // 3. Logout
      await page.click('[data-testid="logout-button"]');

      // 4. Deve voltar ao login e não conseguir acessar o dashboard
      await expect(page).toHaveURL('/login');
      await page.goto('/');
      await expect(page).toHaveURL('/login');
    },
  );

  // ─── Jornada E: persistência de sessão após reload ───────────────────────

  test.fixme(
    'Jornada E — sessão persiste após reload da página',
    async ({ page }) => {
      // 1. Login
      await page.goto('/login');
      await fillLoginForm(page, 'admin@ged.local', 'Admin@12345');
      await expect(page).toHaveURL('/');

      // 2. Reload
      await page.reload();

      // 3. Deve continuar autenticado
      await expect(page).toHaveURL('/');
      await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
    },
  );

  // ─── Jornada F: validação de formulário no client ────────────────────────

  test.fixme(
    'Jornada F — email inválido exibe erro de validação sem chamar a API',
    async ({ page }) => {
      await page.goto('/login');

      // Envia email inválido
      await page.fill('[data-testid="email"]', 'nao-e-um-email');
      await page.fill('[data-testid="password"]', 'Senha@12345');
      await page.click('[data-testid="submit"]');

      // Deve exibir erro de validação de cliente (sem redirecionar)
      await expect(page).toHaveURL('/login');
      await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    },
  );
});
