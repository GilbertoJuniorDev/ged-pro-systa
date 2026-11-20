import { render, screen } from '@testing-library/react';
import { PrimaryAdjustmentWarning } from './primary-adjustment-warning';

describe('PrimaryAdjustmentWarning', () => {
  it('não mostra nada quando a primária não foi ajustada em nenhum Tema', () => {
    const { container } = render(<PrimaryAdjustmentWarning adjustedModes={[]} />);

    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('avisa em qual Tema a primária foi ajustada', () => {
    render(<PrimaryAdjustmentWarning adjustedModes={['dark']} />);

    const warning = screen.getByRole('status');
    expect(warning).toHaveTextContent(/Tema escuro/);
    expect(warning).not.toHaveTextContent(/claro/);
    expect(warning).toHaveTextContent(/ajustada automaticamente/i);
  });

  it('nomeia os dois Temas quando ambos foram ajustados', () => {
    render(<PrimaryAdjustmentWarning adjustedModes={['light', 'dark']} />);

    expect(screen.getByRole('status')).toHaveTextContent(/Temas claro e escuro/);
  });

  it('deixa claro que salvar continua permitido', () => {
    render(<PrimaryAdjustmentWarning adjustedModes={['light']} />);

    expect(screen.getByRole('status')).toHaveTextContent(/pode salvar/i);
  });
});
