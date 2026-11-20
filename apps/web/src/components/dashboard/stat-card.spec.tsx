import { render, screen } from '@testing-library/react';
import { FileStack } from 'lucide-react';
import { StatCard } from './stat-card';

describe('StatCard', () => {
  it('should render the title, value and hint when hint is provided', () => {
    render(
      <StatCard title="Total de documentos" value={128} icon={FileStack} tone="primary" hint="Últimos 30 dias" />,
    );

    expect(screen.getByText('Total de documentos')).toBeInTheDocument();
    expect(screen.getByText('128')).toBeInTheDocument();
    expect(screen.getByText('Últimos 30 dias')).toBeInTheDocument();
  });

  it('should not render a hint element when hint is omitted', () => {
    render(<StatCard title="Departamentos" value={5} icon={FileStack} tone="success" />);

    expect(screen.getByText('Departamentos')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.queryByText(/Últimos/)).not.toBeInTheDocument();
  });

  it('should render a string value as-is', () => {
    render(<StatCard title="Armazenamento" value="1.2 GB" icon={FileStack} tone="info" />);

    expect(screen.getByText('1.2 GB')).toBeInTheDocument();
  });

  it.each([
    ['primary', 'text-primary'],
    ['secondary', 'text-secondary'],
    ['success', 'text-success'],
    ['warning', 'text-warning'],
    ['danger', 'text-danger'],
    ['info', 'text-info'],
  ] as const)('should paint the icon chip of tone %s with its semantic token', (tone, textClass) => {
    const { container } = render(<StatCard title="KPI" value={1} icon={FileStack} tone={tone} />);

    const chip = container.querySelector('svg')?.parentElement;
    expect(chip).toHaveClass(textClass);
  });
});
