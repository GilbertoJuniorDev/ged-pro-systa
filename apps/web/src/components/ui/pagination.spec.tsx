import { render, screen } from '@testing-library/react';
import { Pagination } from './pagination';

describe('Pagination', () => {
  it('renders nothing when there are no items', () => {
    const { container } = render(
      <Pagination total={0} page={1} limit={20} onPageChange={jest.fn()} itemLabel={['item', 'itens']} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('disables "Anterior" on the first page', () => {
    render(<Pagination total={40} page={1} limit={20} onPageChange={jest.fn()} itemLabel={['item', 'itens']} />);
    expect(screen.getByText('Anterior')).toBeDisabled();
    expect(screen.getByText('Próxima')).not.toBeDisabled();
  });

  it('disables "Próxima" on the last page', () => {
    render(<Pagination total={40} page={2} limit={20} onPageChange={jest.fn()} itemLabel={['item', 'itens']} />);
    expect(screen.getByText('Próxima')).toBeDisabled();
    expect(screen.getByText('Anterior')).not.toBeDisabled();
  });

  it('uses the singular label when total is 1', () => {
    render(<Pagination total={1} page={1} limit={20} onPageChange={jest.fn()} itemLabel={['item', 'itens']} />);
    expect(screen.getByText(/1 item ·/)).toBeInTheDocument();
  });

  it('uses the plural label otherwise', () => {
    render(<Pagination total={2} page={1} limit={20} onPageChange={jest.fn()} itemLabel={['item', 'itens']} />);
    expect(screen.getByText(/2 itens ·/)).toBeInTheDocument();
  });
});
