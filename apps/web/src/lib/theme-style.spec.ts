import { DEFAULT_PORTAL_APPEARANCE, DEFAULT_SYSTEM_APPEARANCE } from '@ged/types';
import { deriveSemanticTokens, SEMANTIC_TOKEN_NAMES } from '@ged/utils';
import { buildPortalThemeCss, buildSystemThemeCss, PORTAL_THEME_CLASS } from './theme-style';
import type { PortalAppearanceDto, SystemAppearanceDto } from '@/types';

const UPDATED_AT = new Date(0).toISOString();

function systemAppearance(overrides: Partial<SystemAppearanceDto> = {}): SystemAppearanceDto {
  return { ...DEFAULT_SYSTEM_APPEARANCE, updatedAt: UPDATED_AT, ...overrides };
}

function portalAppearance(overrides: Partial<PortalAppearanceDto> = {}): PortalAppearanceDto {
  return { ...DEFAULT_PORTAL_APPEARANCE, updatedAt: UPDATED_AT, ...overrides };
}

describe('buildSystemThemeCss', () => {
  // Contract do ADR 0002: fora do portal ninguém usa mais rampa crua do Tailwind (a regra
  // de lint ged/no-raw-color-classes garante), então o sistema emite só os tokens `--ged-*`.
  it('não retinge mais as rampas do Tailwind — só tokens semânticos', () => {
    const css = buildSystemThemeCss(systemAppearance({ primaryColor: '#16a34a' }));

    expect(css).not.toMatch(/--color-(indigo|sky|slate)-\d+:/);
    expect(css).not.toContain('--color-primary-foreground');
    expect(css).toContain('--ged-primary:');
  });

  // Estes três testes travam o contrato de cascata descrito em theme-style.ts. Sem ele o
  // CSS é gerado corretamente e mesmo assim perde para o Tailwind ou para globals.css.
  it('usa :root:root para vencer regras estáticas de globals.css independentemente da ordem', () => {
    expect(buildSystemThemeCss(systemAppearance())).toContain(':root:root,');
  });

  it('usa :root:root.light no bloco claro, que fica no mesmo elemento que :root', () => {
    expect(buildSystemThemeCss(systemAppearance())).toContain(':root:root.light,');
  });

  it('nunca envolve o CSS em @layer, que perderia para regras sem layer', () => {
    expect(buildSystemThemeCss(systemAppearance())).not.toContain('@layer');
    expect(buildPortalThemeCss(portalAppearance())).not.toContain('@layer');
  });

  it('cai nos defaults quando a cor salva está corrompida', () => {
    const css = buildSystemThemeCss(systemAppearance({ primaryColor: 'javascript:alert(1)' }));
    const fallback = deriveSemanticTokens(DEFAULT_SYSTEM_APPEARANCE, 'light').tokens;

    expect(css).toContain(`--ged-primary:${fallback.primary};`);
    expect(css).not.toContain('javascript');
  });

  // O CSS vai para dangerouslySetInnerHTML, então uma cor corrompida no banco não pode
  // virar markup. As cores são validadas no DTO da API, mas defesa em profundidade.
  it.each(['</style><script>alert(1)</script>', '#fff"><script>', 'red;}'])(
    'nunca emite `<` a partir da cor inválida %s',
    (primaryColor) => {
      expect(buildSystemThemeCss(systemAppearance({ primaryColor }))).not.toContain('<');
    },
  );
});

describe('buildPortalThemeCss', () => {
  it('tem escopo no wrapper do portal, nunca em :root', () => {
    const css = buildPortalThemeCss(portalAppearance());

    expect(css).toContain(`.${PORTAL_THEME_CLASS}.${PORTAL_THEME_CLASS}{`);
    expect(css).not.toContain(':root');
  });

  // Declarar os aliases dentro do escopo é o que faz `var()` resolver contra a rampa do
  // PORTAL. Em :root eles resolveriam contra a do sistema e herdariam o valor congelado.
  it('declara os aliases --portal-color-* dentro do mesmo bloco das rampas', () => {
    const css = buildPortalThemeCss(portalAppearance());

    expect(css).toContain('--portal-color-primary:var(--color-indigo-700);');
    expect(css).toContain('--portal-color-surface:var(--color-slate-50);');
    expect(css.match(/\{/g)).toHaveLength(1);
  });

  it('retinge as rampas do portal sem depender da cor do sistema', () => {
    const css = buildPortalThemeCss(portalAppearance({ primaryColor: '#b91c1c' }));

    expect(css).toContain('--color-indigo-600:#b91c1c;');
  });

  it('cai nos defaults quando a cor salva está corrompida', () => {
    const css = buildPortalThemeCss(portalAppearance({ backgroundColor: 'nao-e-cor' }));

    expect(css).toContain('--color-slate-50:#f8fafc;');
  });
});

describe('buildSystemThemeCss — tokens semânticos por Tema', () => {
  /**
   * Valor do token resolvido em `el`. O jsdom aplica a cascata (seletores/especificidade)
   * em cada elemento, mas não implementa a herança de custom properties — então subimos
   * pelos ancestrais até o primeiro que declara o token, que é a regra de herança do CSS.
   */
  function tokenAt(el: Element, token: string): string {
    for (let node: Element | null = el; node; node = node.parentElement) {
      const value = getComputedStyle(node).getPropertyValue(`--ged-${token}`).trim();
      if (value) return value;
    }
    return '';
  }

  function mountTheme(appearance: SystemAppearanceDto): void {
    document.head.innerHTML = `<style>${buildSystemThemeCss(appearance)}</style>`;
  }

  const palette = {
    primaryColor: '#16a34a',
    secondaryColor: '#0ea5e9',
    backgroundColor: '#0f172a',
  };
  const light = deriveSemanticTokens(palette, 'light').tokens;
  const dark = deriveSemanticTokens(palette, 'dark').tokens;

  afterEach(() => {
    document.head.innerHTML = '';
    document.body.innerHTML = '';
    document.documentElement.className = '';
  });

  it('declara todos os tokens, para os dois Temas', () => {
    const css = buildSystemThemeCss(systemAppearance(palette));

    for (const token of SEMANTIC_TOKEN_NAMES) {
      expect(css.match(new RegExp(`--ged-${token}:`, 'g'))).toHaveLength(2);
    }
  });

  it('sem classe no <html>, vale o Tema escuro (padrão)', () => {
    mountTheme(systemAppearance(palette));

    expect(tokenAt(document.documentElement, 'background')).toBe(dark.background);
  });

  it.each([
    ['dark', dark],
    ['light', light],
  ] as const)('<html class="%s"> resolve os tokens daquele Tema', (mode, expected) => {
    mountTheme(systemAppearance(palette));
    document.documentElement.className = mode;
    document.body.innerHTML = '<main><p id="alvo">x</p></main>';
    const target = document.getElementById('alvo')!;

    for (const token of SEMANTIC_TOKEN_NAMES) {
      expect(tokenAt(target, token)).toBe(expected[token]);
    }
  });

  it('um trecho marcado .light dentro do <html class="dark"> resolve os tokens claros', () => {
    mountTheme(systemAppearance(palette));
    document.documentElement.className = 'dark';
    document.body.innerHTML =
      '<div id="fora"></div><div class="light"><div><span id="dentro"></span></div></div>';

    expect(tokenAt(document.getElementById('dentro')!, 'background')).toBe(light.background);
    expect(tokenAt(document.getElementById('dentro')!, 'primary')).toBe(light.primary);
    expect(tokenAt(document.getElementById('fora')!, 'background')).toBe(dark.background);
  });

  it('um trecho marcado .dark dentro do <html class="light"> resolve os tokens escuros', () => {
    mountTheme(systemAppearance(palette));
    document.documentElement.className = 'light';
    document.body.innerHTML = '<section class="dark"><span id="dentro"></span></section>';

    expect(tokenAt(document.getElementById('dentro')!, 'foreground')).toBe(dark.foreground);
  });

  it('vale o ancestral marcado mais próximo', () => {
    mountTheme(systemAppearance(palette));
    document.documentElement.className = 'dark';
    document.body.innerHTML =
      '<div class="light"><div class="dark"><span id="alvo"></span></div></div>';

    expect(tokenAt(document.getElementById('alvo')!, 'surface')).toBe(dark.surface);
  });

  it('Paleta corrompida cai nos tokens da Paleta padrão', () => {
    const css = buildSystemThemeCss(systemAppearance({ backgroundColor: 'nao-e-cor' }));
    const fallback = deriveSemanticTokens(DEFAULT_SYSTEM_APPEARANCE, 'light').tokens;

    expect(css).toContain(`--ged-background:${fallback.background};`);
    expect(css).not.toContain('nao-e-cor');
  });

  it('não declara os aliases antigos (--color-primary etc.)', () => {
    const css = buildSystemThemeCss(systemAppearance(palette));

    expect(css).not.toMatch(/--color-(primary|surface|secondary):/);
  });
});
