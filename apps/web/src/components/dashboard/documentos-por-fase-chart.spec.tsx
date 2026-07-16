import { cloneElement, type ReactElement } from 'react';
import { render, screen } from '@testing-library/react';
import { useTheme } from 'next-themes';
import { DocumentosPorFaseChart } from './documentos-por-fase-chart';

jest.mock('next-themes', () => ({
  useTheme: jest.fn(),
}));

// ResponsiveContainer measures via ResizeObserver, unavailable in jsdom — give
// the chart a fixed size directly so Recharts has geometry to render against.
jest.mock('recharts', () => {
  const actual = jest.requireActual('recharts');
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: ReactElement<{ width?: number; height?: number }> }) =>
      cloneElement(children, { width: 400, height: 300 }),
  };
});

const mockUseTheme = useTheme as jest.MockedFunction<typeof useTheme>;

describe('DocumentosPorFaseChart', () => {
  beforeEach(() => {
    mockUseTheme.mockReturnValue({
      theme: 'dark',
      setTheme: jest.fn(),
      forcedTheme: undefined,
      resolvedTheme: 'dark',
      themes: ['light', 'dark'],
      systemTheme: undefined,
    });
  });

  it('should render one pie sector per fase when there is data', () => {
    const { container } = render(<DocumentosPorFaseChart data={{ corrente: 8, intermediario: 3 }} />);

    expect(screen.getByText('Documentos por Fase')).toBeInTheDocument();
    expect(container.querySelectorAll('.recharts-pie-sector')).toHaveLength(2);
    expect(screen.queryByText('Nenhum documento cadastrado.')).not.toBeInTheDocument();
  });

  it('should render the empty state and no chart when both counts are zero', () => {
    const { container } = render(<DocumentosPorFaseChart data={{ corrente: 0, intermediario: 0 }} />);

    expect(screen.getByText('Nenhum documento cadastrado.')).toBeInTheDocument();
    expect(container.querySelectorAll('.recharts-pie-sector')).toHaveLength(0);
  });
});
