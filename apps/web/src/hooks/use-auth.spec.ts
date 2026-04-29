import { renderHook } from '@testing-library/react';
import { useAuth } from './use-auth';

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
}));

import { useSession } from 'next-auth/react';

const mockUseSession = useSession as jest.MockedFunction<typeof useSession>;

describe('useAuth', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return isAuthenticated true when session is active', () => {
    mockUseSession.mockReturnValue({
      data: {
        user: { id: 'u1', email: 'user@test.com', name: 'User', accessToken: 'tok' } as unknown as import('next-auth').Session['user'],
        expires: '2099-01-01',
      },
      status: 'authenticated',
      update: jest.fn(),
    });

    const { result } = renderHook(() => useAuth());

    expect(result.current.isAuthenticated).toBe(true);
  });

  it('should return isAuthenticated false when session is null', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: jest.fn(),
    });

    const { result } = renderHook(() => useAuth());

    expect(result.current.isAuthenticated).toBe(false);
  });

  it('should return isLoading true when status is loading', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'loading',
      update: jest.fn(),
    });

    const { result } = renderHook(() => useAuth());

    expect(result.current.isLoading).toBe(true);
  });

  it('should return typed user data from session', () => {
    const mockUser = {
      id: 'u1',
      email: 'user@test.com',
      name: 'Usuário Teste',
      role: 'MANAGER' as const,
      accessToken: 'access-token-123',
    };

    mockUseSession.mockReturnValue({
      data: {
        user: mockUser,
        expires: '2099-01-01',
      },
      status: 'authenticated',
      update: jest.fn(),
    });

    const { result } = renderHook(() => useAuth());

    expect(result.current.user?.email).toBe('user@test.com');
    expect(result.current.user?.role).toBe('MANAGER');
    expect(result.current.user?.accessToken).toBe('access-token-123');
  });
});
