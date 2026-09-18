import { render, screen } from '@testing-library/react';
import type { SystemAppearanceDto } from '@/types';
import { SystemAppearancePageClient } from './system-appearance-page-client';

const mockUseSystemAppearance = jest.fn();
const mockMutate = jest.fn();

jest.mock('@/hooks/use-system-appearance', () => ({
  useSystemAppearance: () => mockUseSystemAppearance(),
  useUpdateSystemAppearance: () => ({ mutate: mockMutate, isPending: false }),
  useUploadSystemLogo: () => ({ mutate: mockMutate, isPending: false }),
  useDeleteSystemLogo: () => ({ mutate: mockMutate, isPending: false }),
}));

jest.mock('next-themes', () => ({ useTheme: () => ({ resolvedTheme: 'dark' }) }));

const SAVED: SystemAppearanceDto = {
  primaryColor: '#16a34a',
  secondaryColor: '#db2777',
  backgroundColor: '#450a0a',
  hasLogo: false,
  logoVersion: 0,
  updatedAt: new Date(0).toISOString(),
};

describe('SystemAppearancePageClient', () => {
  beforeEach(() => {
    mockUseSystemAppearance.mockReset();
    mockMutate.mockReset();
  });

  it('mostra as cores salvas quando a carga funciona', () => {
    mockUseSystemAppearance.mockReturnValue({ data: SAVED, isLoading: false, isError: false });

    render(<SystemAppearancePageClient />);

    // Cada ColorField renderiza dois inputs com o mesmo valor: o seletor visual
    // (<input type="color">) e o campo de texto hex.
    expect(screen.getAllByDisplayValue('#16a34a')).toHaveLength(2);
    expect(screen.getAllByDisplayValue('#450a0a')).toHaveLength(2);
  });

  it('mostra um spinner enquanto carrega', () => {
    mockUseSystemAppearance.mockReturnValue({ data: undefined, isLoading: true, isError: false });

    render(<SystemAppearancePageClient />);

    expect(screen.queryByText('Cor primária')).not.toBeInTheDocument();
  });

  // O bug: sem tratar isError, `data` fica undefined e o formulário renderizava os
  // DEFAULT_VALUES hardcoded como se fossem a configuração salva — o admin editava e
  // salvava por cima de uma tela que nunca refletiu o estado real.
  it('mostra erro em vez do formulário quando a carga falha', () => {
    mockUseSystemAppearance.mockReturnValue({ data: undefined, isLoading: false, isError: true });

    render(<SystemAppearancePageClient />);

    expect(screen.getByText(/não foi possível carregar a aparência salva/i)).toBeInTheDocument();
  });

  it('nunca apresenta os defaults como configuração salva quando a carga falha', () => {
    mockUseSystemAppearance.mockReturnValue({ data: undefined, isLoading: false, isError: true });

    render(<SystemAppearancePageClient />);

    expect(screen.queryByDisplayValue('#4f46e5')).not.toBeInTheDocument();
    expect(screen.queryByText('Salvar cores')).not.toBeInTheDocument();
  });
});
