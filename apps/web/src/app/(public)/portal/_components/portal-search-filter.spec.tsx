import { render, screen } from '@testing-library/react';
import { deriveSemanticTokens } from '@ged/utils';
import { buildSystemThemeCss, DEFAULT_SYSTEM_PALETTE } from '@/lib/theme-style';
import { PortalSearchFilter } from './portal-search-filter';

// A Combobox compartilhada pinta-se com os tokens semânticos `--ged-*` (ADR 0002). O portal
// público é sempre claro, independente do Tema do usuário: o wrapper `.light` da Combobox
// é um trecho de Tema claro, onde os tokens são redeclarados com os valores do claro.

// jsdom não herda custom properties — sobe a árvore até o ancestral que declara o token.
function tokenAt(el: Element, token: string): string {
  for (let node: Element | null = el; node; node = node.parentElement) {
    const value = getComputedStyle(node).getPropertyValue(`--ged-${token}`).trim();
    if (value) return value;
  }
  return '';
}

function renderFilter() {
  return render(
    <PortalSearchFilter
      search=""
      onSearchChange={jest.fn()}
      serieId=""
      onSerieChange={jest.fn()}
      serieOptions={[{ label: 'Série A', value: 'a' }]}
    />,
  );
}

describe('PortalSearchFilter', () => {
  afterEach(() => {
    document.head.innerHTML = '';
    document.documentElement.className = '';
  });

  it('forces the série Combobox into a light-theme subtree', () => {
    renderFilter();

    expect(screen.getByRole('button').closest('.light')).not.toBeNull();
  });

  it('a Combobox resolve os tokens do Tema claro com o usuário em Tema escuro', () => {
    const appearance = DEFAULT_SYSTEM_PALETTE;
    document.head.innerHTML = `<style>${buildSystemThemeCss(appearance)}</style>`;
    document.documentElement.className = 'dark';
    renderFilter();

    const light = deriveSemanticTokens(appearance, 'light').tokens;
    const dark = deriveSemanticTokens(appearance, 'dark').tokens;
    const trigger = screen.getByRole('button');
    expect(tokenAt(trigger, 'surface')).toBe(light.surface);
    expect(tokenAt(trigger, 'foreground')).toBe(light.foreground);
    expect(tokenAt(trigger, 'foreground')).not.toBe(dark.foreground);
    expect(tokenAt(trigger, 'border')).toBe(light.border);
  });
});
