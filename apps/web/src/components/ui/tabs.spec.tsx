import { render, screen } from '@testing-library/react';
import { Tabs, type TabItem } from './tabs';

const items: TabItem[] = [
  { value: 'arquivos', label: 'Arquivos', href: '/documents' },
  { value: 'dossies', label: 'Dossiês', href: '/documents?view=dossies' },
];

describe('Tabs', () => {
  it('marks the active tab with aria-selected and the others as not selected', () => {
    render(<Tabs items={items} active="dossies" />);

    expect(screen.getByRole('tab', { name: 'Arquivos' })).toHaveAttribute('aria-selected', 'false');
    expect(screen.getByRole('tab', { name: 'Dossiês' })).toHaveAttribute('aria-selected', 'true');
  });

  it('renders each tab as a link carrying the given href', () => {
    render(<Tabs items={items} active="arquivos" />);

    expect(screen.getByRole('tab', { name: 'Dossiês' })).toHaveAttribute(
      'href',
      '/documents?view=dossies',
    );
  });
});
