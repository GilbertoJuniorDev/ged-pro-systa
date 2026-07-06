import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { usePathname } from 'next/navigation';
import { Sidebar } from './sidebar';

jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}));

jest.mock('@/providers/navigation-provider', () => ({
  useNavigation: () => ({ startNavigation: jest.fn() }),
}));

jest.mock('@/hooks/use-permissions', () => ({
  usePermissions: () => ({ hasModuleAccess: () => true }),
}));

jest.mock('./user-menu', () => ({
  UserMenu: () => <div data-testid="user-menu-mock" />,
}));

jest.mock('./theme-toggle', () => ({
  ThemeToggle: () => <button type="button" aria-label="Alternar tema" />,
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: function MockLink({
    children,
    href,
    className,
  }: {
    children: React.ReactNode;
    href: string;
    className?: string;
  }) {
    return (
      <a href={href} className={className}>
        {children}
      </a>
    );
  },
}));

const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>;

const defaultUser = {
  name: 'Test User',
  email: 'test@example.com',
  role: 'USER',
};

describe('Sidebar', () => {
  it('should render all navigation links', () => {
    mockUsePathname.mockReturnValue('/');

    render(<Sidebar user={defaultUser} isOpen={false} onClose={jest.fn()} />);

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Documentos')).toBeInTheDocument();
    expect(screen.getByText('Categorias')).toBeInTheDocument();
  });

  it('should apply active styles to the current route link', () => {
    mockUsePathname.mockReturnValue('/');

    render(<Sidebar user={defaultUser} isOpen={false} onClose={jest.fn()} />);

    const dashboardLink = screen.getByText('Dashboard').closest('a');
    expect(dashboardLink).toHaveClass('bg-indigo-50');
  });

  it('should reflect the isOpen prop in the sidebar translate classes', () => {
    mockUsePathname.mockReturnValue('/');

    const { rerender } = render(<Sidebar user={defaultUser} isOpen={false} onClose={jest.fn()} />);

    const aside = screen.getByRole('complementary');
    expect(aside.className).toContain('-translate-x-full');

    rerender(<Sidebar user={defaultUser} isOpen onClose={jest.fn()} />);

    expect(aside.className).not.toContain('-translate-x-full');
    expect(aside.className).toContain('translate-x-0');
  });

  it('should call onClose when the mobile close button is clicked', () => {
    mockUsePathname.mockReturnValue('/');
    const onClose = jest.fn();

    render(<Sidebar user={defaultUser} isOpen onClose={onClose} />);

    fireEvent.click(screen.getByLabelText('Fechar menu'));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should render UserMenu component in the footer', () => {
    mockUsePathname.mockReturnValue('/');

    render(<Sidebar user={defaultUser} isOpen={false} onClose={jest.fn()} />);

    expect(screen.getByLabelText('Alternar tema')).toBeInTheDocument();
    expect(screen.getByTestId('user-menu-mock')).toBeInTheDocument();
  });
});
