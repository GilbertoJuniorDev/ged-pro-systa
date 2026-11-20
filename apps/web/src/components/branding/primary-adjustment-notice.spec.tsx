import { render, screen } from '@testing-library/react';
import type { PrimaryAdjustment, ThemeMode } from '@ged/utils';
import { PrimaryAdjustmentNotice } from './primary-adjustment-notice';

type Adjustments = Readonly<Record<ThemeMode, PrimaryAdjustment>>;

function renderNotice(adjustments: Adjustments) {
  return render(<PrimaryAdjustmentNotice adjustments={adjustments} />);
}

describe('PrimaryAdjustmentNotice', () => {
  it('should render nothing when the primary was not adjusted in any Tema', () => {
    const { container } = renderNotice({ light: 'none', dark: 'none' });

    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('should show a neutral informative note when the dark adjustment is minor', () => {
    renderNotice({ light: 'none', dark: 'minor' });

    const note = screen.getByRole('status');
    expect(note).toHaveTextContent(
      'No Tema escuro usamos um tom mais claro da primária para manter a legibilidade.',
    );
    expect(note).toHaveAttribute('data-tone', 'info');
    expect(note.className).not.toMatch(/warning/);
  });

  it('should say a darker tone is used when the light adjustment is minor', () => {
    renderNotice({ light: 'minor', dark: 'none' });

    expect(screen.getByRole('status')).toHaveTextContent(
      'No Tema claro usamos um tom mais escuro da primária para manter a legibilidade.',
    );
  });

  it('should name both Temas when both had minor adjustments', () => {
    renderNotice({ light: 'minor', dark: 'minor' });

    expect(screen.getByRole('status')).toHaveTextContent(
      'No Tema claro usamos um tom mais escuro e no Tema escuro um tom mais claro da primária para manter a legibilidade.',
    );
  });

  it('should escalate to a warning naming the Tema when an adjustment is large', () => {
    renderNotice({ light: 'none', dark: 'large' });

    const warning = screen.getByRole('status');
    expect(warning).toHaveAttribute('data-tone', 'warning');
    expect(warning).toHaveTextContent(/no Tema escuro/i);
    expect(warning).toHaveTextContent(/bem diferente/i);
    expect(warning).toHaveTextContent(/pode salvar/i);
  });

  it('should name only the Temas with a large adjustment when the other one is minor', () => {
    renderNotice({ light: 'large', dark: 'minor' });

    const warning = screen.getByRole('status');
    expect(warning).toHaveAttribute('data-tone', 'warning');
    expect(warning).toHaveTextContent(/no Tema claro/i);
    expect(warning).not.toHaveTextContent(/escuro/i);
  });

  it('should name both Temas when both adjustments are large', () => {
    renderNotice({ light: 'large', dark: 'large' });

    expect(screen.getByRole('status')).toHaveTextContent(/nos Temas claro e escuro/i);
  });
});
