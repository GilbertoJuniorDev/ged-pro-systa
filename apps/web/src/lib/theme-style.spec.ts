import { DEFAULT_PORTAL_APPEARANCE, DEFAULT_SYSTEM_APPEARANCE } from '@ged/types';
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
  it('reproduz a paleta original do Tailwind quando as cores são as default', () => {
    const css = buildSystemThemeCss(systemAppearance());

    // Se isto quebrar, manter o default deixa de ser um no-op visual e a aparência do app
    // inteiro muda sem ninguém ter pedido.
    expect(css).toContain('--color-indigo-600:#4f46e5;');
    expect(css).toContain('--color-sky-500:#0ea5e9;');
    expect(css).toContain('--color-slate-900:#0f172a;');
    expect(css).toContain('--color-slate-950:#020617;');
  });

  it('emite as 33 paradas das três rampas', () => {
    const css = buildSystemThemeCss(systemAppearance());

    for (const family of ['indigo', 'sky', 'slate']) {
      const declared = css.match(new RegExp(`--color-${family}-\\d+:`, 'g'));
      expect(declared).toHaveLength(11);
    }
  });

  it('retinge a rampa indigo inteira com a cor primária escolhida', () => {
    const css = buildSystemThemeCss(systemAppearance({ primaryColor: '#16a34a' }));

    expect(css).toContain('--color-indigo-600:#16a34a;');
    expect(css).not.toContain('#4f46e5');
  });

  // Estes três testes travam o contrato de cascata descrito em theme-style.ts. Sem ele o
  // CSS é gerado corretamente e mesmo assim perde para o Tailwind ou para globals.css.
  it('usa :root:root para vencer os aliases de globals.css independentemente da ordem', () => {
    expect(buildSystemThemeCss(systemAppearance())).toContain(':root:root{');
  });

  it('usa :root:root.light no bloco claro, que fica no mesmo elemento que :root', () => {
    expect(buildSystemThemeCss(systemAppearance())).toContain(':root:root.light{');
  });

  it('nunca envolve o CSS em @layer, que perderia para regras sem layer', () => {
    expect(buildSystemThemeCss(systemAppearance())).not.toContain('@layer');
    expect(buildPortalThemeCss(portalAppearance())).not.toContain('@layer');
  });

  it('cai nos defaults quando a cor salva está corrompida', () => {
    const css = buildSystemThemeCss(systemAppearance({ primaryColor: 'javascript:alert(1)' }));

    expect(css).toContain('--color-indigo-600:#4f46e5;');
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
