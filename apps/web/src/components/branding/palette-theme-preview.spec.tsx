import { render, screen } from '@testing-library/react';
import { DEFAULT_SYSTEM_APPEARANCE } from '@ged/types';
import { PaletteThemePreview } from './palette-theme-preview';

const DEFAULT_PALETTE = {
  primaryColor: DEFAULT_SYSTEM_APPEARANCE.primaryColor,
  secondaryColor: DEFAULT_SYSTEM_APPEARANCE.secondaryColor,
  backgroundColor: DEFAULT_SYSTEM_APPEARANCE.backgroundColor,
};

function themePanel(name: RegExp): HTMLElement {
  return screen.getByRole('group', { name });
}

describe('PaletteThemePreview', () => {
  it('mostra a Paleta nos dois Temas, cada um com seus próprios tokens', () => {
    render(<PaletteThemePreview palette={DEFAULT_PALETTE} />);

    const light = themePanel(/tema claro/i);
    const dark = themePanel(/tema escuro/i);

    // Valores conhecidos da Paleta padrão (notes/20): no escuro a primária #4f46e5
    // não atinge 4.5:1 e vira #8882ed; no claro ela fica intacta.
    expect(light).toHaveClass('light');
    expect(light.style.getPropertyValue('--ged-primary')).toBe('#4f46e5');
    expect(light.style.getPropertyValue('--ged-background')).toBe('#f8fafc');
    expect(dark).toHaveClass('dark');
    expect(dark.style.getPropertyValue('--ged-primary')).toBe('#8882ed');
    expect(dark.style.getPropertyValue('--ged-background')).toBe('#020617');
  });

  it('mostra superfícies, texto, primária, secundária e status', () => {
    render(<PaletteThemePreview palette={DEFAULT_PALETTE} />);

    const light = themePanel(/tema claro/i);
    for (const label of ['Botão primário', 'Secundária', 'Sucesso', 'Atenção', 'Erro', 'Info']) {
      expect(light).toHaveTextContent(label);
    }
  });

  it('acompanha a cor que o admin está escolhendo', () => {
    const { rerender } = render(<PaletteThemePreview palette={DEFAULT_PALETTE} />);

    rerender(<PaletteThemePreview palette={{ ...DEFAULT_PALETTE, primaryColor: '#1d4ed8' }} />);

    expect(themePanel(/tema claro/i).style.getPropertyValue('--ged-primary')).toBe('#1d4ed8');
  });

  it('avisa em qual Tema a primária foi ajustada', () => {
    render(<PaletteThemePreview palette={DEFAULT_PALETTE} />);

    const warning = screen.getByRole('status');
    expect(warning).toHaveTextContent(/no Tema escuro/);
  });

  it('pede cores válidas em vez de quebrar com hex incompleto', () => {
    render(<PaletteThemePreview palette={{ ...DEFAULT_PALETTE, primaryColor: '#12' }} />);

    expect(screen.getByText(/informe cores válidas/i)).toBeInTheDocument();
    expect(screen.queryByRole('group')).not.toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});
