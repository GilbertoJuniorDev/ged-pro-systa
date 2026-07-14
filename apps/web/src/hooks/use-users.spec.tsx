import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { toast } from 'sonner';
import { useUsers, useUpdateUser, useToggleUserActive, useDeleteUser } from './use-users';
import { apiClient } from '../lib/api-client';
import type { UserDto } from '../types';

jest.mock('next-auth/react', () => ({
  useSession: jest.fn().mockReturnValue({
    data: { user: { accessToken: 'test-token', id: 'admin-uuid' } },
    status: 'authenticated',
  }),
}));

jest.mock('../lib/api-client', () => ({
  apiClient: {
    get: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

const mockedToast = toast as jest.Mocked<typeof toast>;
const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>;

function makeUserDto(overrides: Partial<UserDto> = {}): UserDto {
  return {
    id: 'uuid-1',
    name: 'Test User',
    email: 'test@ged.local',
    role: 'VIEWER',
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    departamentoIds: [],
    ...overrides,
  };
}

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('useUsers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch and return users list', async () => {
    const users = [makeUserDto(), makeUserDto({ id: 'uuid-2', email: 'other@ged.local' })];
    mockedApiClient.get.mockResolvedValue(users);

    const { result } = renderHook(() => useUsers(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toHaveLength(2);
    expect(mockedApiClient.get).toHaveBeenCalledWith('/users', { token: 'test-token' });
  });

  it('should set isError when fetch fails', async () => {
    mockedApiClient.get.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useUsers(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useUpdateUser', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call apiClient.patch with correct arguments on mutation', async () => {
    const updated = makeUserDto({ name: 'Novo Nome', role: 'VIEWER' });
    mockedApiClient.patch.mockResolvedValue(updated);

    const { result } = renderHook(() => useUpdateUser(), { wrapper: createWrapper() });

    act(() => {
      result.current.mutate({ id: 'uuid-1', payload: { name: 'Novo Nome', role: 'VIEWER' } });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedApiClient.patch).toHaveBeenCalledWith(
      '/users/uuid-1',
      { name: 'Novo Nome', role: 'VIEWER' },
      { token: 'test-token' },
    );
    expect(mockedToast.success).toHaveBeenCalledWith('Usuário atualizado com sucesso!');
  });

  it('should call toast.error when update fails', async () => {
    mockedApiClient.patch.mockRejectedValue(new Error('Usuário não encontrado'));

    const { result } = renderHook(() => useUpdateUser(), { wrapper: createWrapper() });

    act(() => {
      result.current.mutate({ id: 'nonexistent', payload: { name: 'X' } });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(mockedToast.error).toHaveBeenCalledWith('Usuário não encontrado');
  });
});

describe('useToggleUserActive', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call apiClient.patch on the status endpoint', async () => {
    const deactivated = makeUserDto({ isActive: false });
    mockedApiClient.patch.mockResolvedValue(deactivated);

    const { result } = renderHook(() => useToggleUserActive(), { wrapper: createWrapper() });

    act(() => {
      result.current.mutate({ id: 'uuid-1', isActive: false });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedApiClient.patch).toHaveBeenCalledWith(
      '/users/uuid-1/status',
      { isActive: false },
      { token: 'test-token' },
    );
    expect(mockedToast.success).toHaveBeenCalledWith('Status do usuário atualizado!');
  });

  it('should call toast.error when status update fails', async () => {
    mockedApiClient.patch.mockRejectedValue(new Error('Não é possível alterar o status do próprio usuário'));

    const { result } = renderHook(() => useToggleUserActive(), { wrapper: createWrapper() });

    act(() => {
      result.current.mutate({ id: 'admin-uuid', isActive: false });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(mockedToast.error).toHaveBeenCalled();
  });
});

describe('useDeleteUser', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call apiClient.delete with correct id', async () => {
    mockedApiClient.delete.mockResolvedValue(undefined);

    const { result } = renderHook(() => useDeleteUser(), { wrapper: createWrapper() });

    act(() => {
      result.current.mutate('uuid-1');
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedApiClient.delete).toHaveBeenCalledWith('/users/uuid-1', { token: 'test-token' });
    expect(mockedToast.success).toHaveBeenCalledWith('Usuário excluído com sucesso!');
  });

  it('should call toast.error when delete fails', async () => {
    mockedApiClient.delete.mockRejectedValue(new Error('Usuário não encontrado'));

    const { result } = renderHook(() => useDeleteUser(), { wrapper: createWrapper() });

    act(() => {
      result.current.mutate('nonexistent');
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(mockedToast.error).toHaveBeenCalledWith('Usuário não encontrado');
  });
});
