import { render, screen } from '@testing-library/react';
import { PortalSearchFilter } from './portal-search-filter';

// A Combobox reutilizada aqui usa classes `dark:` internamente (pensada para o dashboard
// dark-first). O portal público é sempre claro, independente do tema ambiente do <html>
// (ver comentário em portal-search-filter.tsx e os overrides `.light .dark\:*` em
// app/globals.css). Este teste garante que o wrapper `.light` continua presente na
// Combobox do filtro de série — é o gancho que faz esses overrides de CSS válerem.
describe('PortalSearchFilter', () => {
  it('forces the série Combobox into the light-theme CSS scope', () => {
    const { container } = render(
      <PortalSearchFilter
        search=""
        onSearchChange={jest.fn()}
        serieId=""
        onSerieChange={jest.fn()}
        serieOptions={[{ label: 'Série A', value: 'a' }]}
      />,
    );

    const trigger = screen.getByRole('button');
    expect(trigger.closest('.light')).not.toBeNull();
    expect(container.querySelector('.light')).not.toBeNull();
  });
});
