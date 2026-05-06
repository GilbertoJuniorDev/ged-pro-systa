import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { toast } from 'sonner';
import {
  useUsuarioPermissoes,
  useAssignPermissao,
  useRevokePermissao,
} from './use-usuario-permissoes';
import { apiClient } from '../lib/api-client';
import type { UsuarioPermissaoDto } from '../types';

jest.mock('next-auth/react', () => ({
  useSession: jest.fn().mockReturnValue({
    data: { user: { accessToken: 'test-token' } },
    status: 'authenticated',
  }),
}));

jest.mock('../lib/api-client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
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

const USER_ID = 'user-uuid-1';

function makeUsuarioPermissao(overrides: Partial<UsuarioPermissaoDto> = {}): UsuarioPermissaoDto {
  return {
    id: 'up-uuid-1',
    usuarioId: USER_ID,
    permissaoId: 'perm-uuid-1',
    permissaoNome: 'DOCUMENTO_VISUALIZAR',
    permissaoDescricao: 'Permite visualizar documentos',
    createdAt: '2026-01-01T00:00:00.000Z',
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

describe('useUsuarioPermissoes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch permissions for a user', async () => {
    const ups = [makeUsuarioPermissao()];
    mockedApiClient.get.mockResolvedValue(ups);

    const { result } = renderHook(() => useUsuarioPermissoes(USER_ID), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toHaveLength(1);
    expect(mockedApiClient.get).toHaveBeenCalledWith(
      `/users/${USER_ID}/permissoes`,
      { token: 'test-token' },
    );
  });

  it('should be disabled when userId is empty', async () => {
    const { result } = renderHook(() => useUsuarioPermissoes(''), { wrapper: createWrapper() });

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockedApiClient.get).not.toHaveBeenCalled();
  });
});

describe('useAssignPermissao', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call apiClient.post and show success toast when assigning', async () => {
    const assigned = makeUsuarioPermissao();
    mockedApiClient.post.mockResolvedValue(assigned);

    const { result } = renderHook(() => useAssignPermissao(USER_ID), { wrapper: createWrapper() });

    act(() => {
      result.current.mutate('perm-uuid-1');
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedApiClient.post).toHaveBeenCalledWith(
      `/users/${USER_ID}/permissoes`,
      { permissaoId: 'perm-uuid-1' },
      { token: 'test-token' },
    );
    expect(mockedToast.success).toHaveBeenCalledWith('Permissão atribuída com sucesso!');
  });

  it('should show error toast when assign fails', async () => {
    mockedApiClient.post.mockRejectedValue(new Error('Permissão já atribuída'));

    const { result } = renderHook(() => useAssignPermissao(USER_ID), { wrapper: createWrapper() });

    act(() => {
      result.current.mutate('perm-uuid-1');
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(mockedToast.error).toHaveBeenCalledWith('Permissão já atribuída');
  });
});

describe('useRevokePermissao', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call apiClient.delete and show success toast when revoking', async () => {
    mockedApiClient.delete.mockResolvedValue(undefined);

    const { result } = renderHook(() => useRevokePermissao(USER_ID), { wrapper: createWrapper() });

    act(() => {
      result.current.mutate('perm-uuid-1');
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedApiClient.delete).toHaveBeenCalledWith(
      `/users/${USER_ID}/permissoes/perm-uuid-1`,
      { token: 'test-token' },
    );
    expect(mockedToast.success).toHaveBeenCalledWith('Permissão revogada com sucesso!');
  });

  it('should show error toast when revoke fails', async () => {
    mockedApiClient.delete.mockRejectedValue(new Error('Permissão não encontrada'));

    const { result } = renderHook(() => useRevokePermissao(USER_ID), { wrapper: createWrapper() });

    act(() => {
      result.current.mutate('perm-uuid-1');
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(mockedToast.error).toHaveBeenCalledWith('Permissão não encontrada');
  });
});
