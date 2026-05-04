import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { usePathname } from 'next/navigation';
import { Sidebar } from './sidebar';

jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}));

jest.mock('./user-menu', () => ({
  UserMenu: () => <div data-testid="user-menu-mock" />,
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

    render(<Sidebar user={defaultUser} />);

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Documentos')).toBeInTheDocument();
    expect(screen.getByText('Categorias')).toBeInTheDocument();
  });

  it('should apply active styles to the current route link', () => {
    mockUsePathname.mockReturnValue('/');

    render(<Sidebar user={defaultUser} />);

    const dashboardLink = screen.getByText('Dashboard').closest('a');
    expect(dashboardLink).toHaveClass('bg-indigo-900/40');
  });

  it('should toggle sidebar visibility when mobile open button is clicked', () => {
    mockUsePathname.mockReturnValue('/');

    render(<Sidebar user={defaultUser} />);

    const aside = screen.getByRole('complementary');
    expect(aside.className).toContain('-translate-x-full');

    const openButton = screen.getByLabelText('Abrir menu');
    fireEvent.click(openButton);

    expect(aside.className).not.toContain('-translate-x-full');
    expect(aside.className).toContain('translate-x-0');
  });

  it('should render UserMenu component in the footer', () => {
    mockUsePathname.mockReturnValue('/');

    render(<Sidebar user={defaultUser} />);

    expect(screen.getByTestId('user-menu-mock')).toBeInTheDocument();
  });
});
