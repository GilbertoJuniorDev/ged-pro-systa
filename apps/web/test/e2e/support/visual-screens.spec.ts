import { parseScreens, screenshotFileName, summarizeViolations } from './visual-screens';

describe('parseScreens', () => {
  it('separa telas públicas e autenticadas e nomeia pela rota', () => {
    expect(parseScreens('/login', '/,/admin/aparencia-sistema')).toEqual([
      { name: 'login', path: '/login', requiresAuth: false },
      { name: 'home', path: '/', requiresAuth: true },
      { name: 'admin-aparencia-sistema', path: '/admin/aparencia-sistema', requiresAuth: true },
    ]);
  });

  it('ignora espaços e entradas vazias', () => {
    expect(parseScreens(' /login , ', '')).toEqual([
      { name: 'login', path: '/login', requiresAuth: false },
    ]);
  });

  it('remove query string do nome mas mantém na rota', () => {
    expect(parseScreens('', '/documentos?status=ativo')).toEqual([
      { name: 'documentos-status-ativo', path: '/documentos?status=ativo', requiresAuth: true },
    ]);
  });
});

describe('screenshotFileName', () => {
  it('combina tela e Tema', () => {
    expect(screenshotFileName('login', 'light')).toBe('login--light.png');
    expect(screenshotFileName('home', 'dark')).toBe('home--dark.png');
  });
});

describe('summarizeViolations', () => {
  it('conta nós por regra e lista os alvos', () => {
    const summary = summarizeViolations([
      {
        id: 'color-contrast',
        impact: 'serious',
        help: 'Elements must meet minimum color contrast ratio thresholds',
        nodes: [{ target: ['.a'] }, { target: ['#b', 'span'] }],
      },
    ]);

    expect(summary).toEqual([
      {
        rule: 'color-contrast',
        impact: 'serious',
        help: 'Elements must meet minimum color contrast ratio thresholds',
        count: 2,
        targets: ['.a', '#b span'],
      },
    ]);
  });

  it('sem violações devolve lista vazia', () => {
    expect(summarizeViolations([])).toEqual([]);
  });
});
