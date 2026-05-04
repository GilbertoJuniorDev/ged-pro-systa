import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { signOut } from 'next-auth/react';
import { UserMenu } from './user-menu';

jest.mock('next-auth/react', () => ({
  signOut: jest.fn(),
}));

const mockSignOut = signOut as jest.MockedFunction<typeof signOut>;

const defaultUser = {
  name: 'João Silva',
  email: 'joao@example.com',
  role: 'USER',
};

describe('UserMenu', () => {
  it('should display user initials in avatar', () => {
    render(<UserMenu user={defaultUser} />);

    expect(screen.getByText('JS')).toBeInTheDocument();
  });

  it('should display "?" when user name is not provided', () => {
    render(<UserMenu user={{ ...defaultUser, name: null }} />);

    expect(screen.getByText('?')).toBeInTheDocument();
  });

  it('should open the menu popover when the user button is clicked', () => {
    render(<UserMenu user={defaultUser} />);

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();

    const trigger = screen.getByRole('button');
    fireEvent.click(trigger);

    expect(screen.getByRole('menu')).toBeInTheDocument();
  });

  it('should call signOut with callbackUrl /login when logout button is clicked', () => {
    render(<UserMenu user={defaultUser} />);

    const trigger = screen.getByRole('button');
    fireEvent.click(trigger);

    const logoutButton = screen.getByRole('menuitem');
    fireEvent.click(logoutButton);

    expect(mockSignOut).toHaveBeenCalledWith({ callbackUrl: '/login' });
  });

  it('should close popover when clicking outside the component', () => {
    render(<UserMenu user={defaultUser} />);

    const trigger = screen.getByRole('button');
    fireEvent.click(trigger);
    expect(screen.getByRole('menu')).toBeInTheDocument();

    fireEvent.mouseDown(document.body);

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });
});
