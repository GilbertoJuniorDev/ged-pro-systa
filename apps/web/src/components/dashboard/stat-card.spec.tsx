import { render, screen } from '@testing-library/react';
import { FileStack } from 'lucide-react';
import { StatCard } from './stat-card';

describe('StatCard', () => {
  it('should render the title, value and hint when hint is provided', () => {
    render(
      <StatCard title="Total de documentos" value={128} icon={FileStack} accent="indigo" hint="Últimos 30 dias" />,
    );

    expect(screen.getByText('Total de documentos')).toBeInTheDocument();
    expect(screen.getByText('128')).toBeInTheDocument();
    expect(screen.getByText('Últimos 30 dias')).toBeInTheDocument();
  });

  it('should not render a hint element when hint is omitted', () => {
    render(<StatCard title="Departamentos" value={5} icon={FileStack} accent="emerald" />);

    expect(screen.getByText('Departamentos')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.queryByText(/Últimos/)).not.toBeInTheDocument();
  });

  it('should render a string value as-is', () => {
    render(<StatCard title="Armazenamento" value="1.2 GB" icon={FileStack} accent="cyan" />);

    expect(screen.getByText('1.2 GB')).toBeInTheDocument();
  });
});
