import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration — GED Systa Web (apps/web)
 *
 * Os testes E2E do frontend precisam do Next.js em execução.
 * Em CI, o server é iniciado automaticamente via `webServer`.
 * Localmente, você pode rodar o servidor antes ou deixar o webServer fazer isso.
 *
 * Execução:
 *   pnpm --filter=web test:e2e          # roda todos os testes
 *   pnpm --filter=web test:e2e --ui     # modo UI interativo
 *
 * Variáveis de ambiente relevantes:
 *   BASE_URL  — sobrescreve a baseURL (default: http://localhost:3000)
 *   CI        — quando definida, desabilita o headless override e ativa retries
 */
export default defineConfig({
  testDir: './test/e2e',

  /* Extensão dos arquivos de teste */
  testMatch: ['**/*.e2e.spec.ts'],

  /* Timeout por teste (30s) e por asserção (5s) */
  timeout: 30_000,
  expect: { timeout: 5_000 },

  /* Em CI, retentar testes que falham uma vez antes de marcar como erro */
  retries: process.env['CI'] ? 1 : 0,

  /* Workers paralelos — 1 em CI para não sobrecarregar, metade dos cores localmente */
  workers: process.env['CI'] ? 1 : '50%',

  /* Relatório HTML gerado em playwright-report/ */
  reporter: process.env['CI']
    ? [['html', { outputFolder: 'playwright-report', open: 'never' }], ['github']]
    : [['html', { outputFolder: 'playwright-report', open: 'on-failure' }]],

  use: {
    /* URL base — todos os `page.goto('/')` usam isso como raiz */
    baseURL: process.env['BASE_URL'] ?? 'http://localhost:3000',

    /* Captura trace ao falhar (útil para depuração) */
    trace: 'on-first-retry',

    /* Screenshot ao falhar */
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],

  /**
   * Inicia o servidor Next.js antes de executar os testes.
   * Aguarda a URL ficar disponível antes de prosseguir.
   *
   * NOTA: Remova ou ajuste `reuseExistingServer: true` conforme seu workflow.
   */
  webServer: {
    command: 'pnpm dev',
    url: process.env['BASE_URL'] ?? 'http://localhost:3000',
    reuseExistingServer: !process.env['CI'],
    timeout: 120_000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
