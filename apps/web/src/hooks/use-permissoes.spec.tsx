import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { toast } from 'sonner';
import {
  usePermissoes,
  useCreatePermissao,
  useUpdatePermissao,
  useDeletePermissao,
} from './use-permissoes';
import { apiClient } from '../lib/api-client';
import type { PermissaoDto } from '../types';

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

function makePermissao(overrides: Partial<PermissaoDto> = {}): PermissaoDto {
  return {
    id: 'perm-uuid-1',
    nome: 'DOCUMENTO_VISUALIZAR',
    descricao: 'Permite visualizar documentos',
    moduloId: null,
    modulo: null,
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

describe('usePermissoes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch and return permissions list', async () => {
    const perms = [makePermissao(), makePermissao({ id: 'perm-uuid-2', nome: 'DOCUMENTO_EDITAR' })];
    mockedApiClient.get.mockResolvedValue(perms);

    const { result } = renderHook(() => usePermissoes(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toHaveLength(2);
    expect(mockedApiClient.get).toHaveBeenCalledWith('/permissoes', { token: 'test-token' });
  });

  it('should set isError when fetch fails', async () => {
    mockedApiClient.get.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => usePermissoes(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useCreatePermissao', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call apiClient.post and show success toast on success', async () => {
    const created = makePermissao();
    mockedApiClient.post.mockResolvedValue(created);

    const { result } = renderHook(() => useCreatePermissao(), { wrapper: createWrapper() });

    act(() => {
      result.current.mutate({ nome: 'DOCUMENTO_VISUALIZAR', descricao: 'Permite visualizar documentos' });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedApiClient.post).toHaveBeenCalledWith(
      '/permissoes',
      { nome: 'DOCUMENTO_VISUALIZAR', descricao: 'Permite visualizar documentos' },
      { token: 'test-token' },
    );
    expect(mockedToast.success).toHaveBeenCalledWith('Permissão criada com sucesso!');
  });

  it('should include moduloId in payload when provided', async () => {
    const created = makePermissao({ moduloId: 'mod-uuid-1', modulo: { id: 'mod-uuid-1', nome: 'Documentos', slug: 'documentos' } });
    mockedApiClient.post.mockResolvedValue(created);

    const { result } = renderHook(() => useCreatePermissao(), { wrapper: createWrapper() });

    act(() => {
      result.current.mutate({ nome: 'DOCUMENTO_VISUALIZAR', moduloId: 'mod-uuid-1' });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedApiClient.post).toHaveBeenCalledWith(
      '/permissoes',
      { nome: 'DOCUMENTO_VISUALIZAR', moduloId: 'mod-uuid-1' },
      { token: 'test-token' },
    );
  });

  it('should call toast.error when creation fails with conflict', async () => {
    mockedApiClient.post.mockRejectedValue(new Error('Permissão já existe'));

    const { result } = renderHook(() => useCreatePermissao(), { wrapper: createWrapper() });

    act(() => {
      result.current.mutate({ nome: 'DOCUMENTO_VISUALIZAR' });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(mockedToast.error).toHaveBeenCalledWith('Permissão já existe');
  });
});

describe('useUpdatePermissao', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call apiClient.patch with id and payload', async () => {
    const updated = makePermissao({ descricao: 'Nova descrição' });
    mockedApiClient.patch.mockResolvedValue(updated);

    const { result } = renderHook(() => useUpdatePermissao(), { wrapper: createWrapper() });

    act(() => {
      result.current.mutate({ id: 'perm-uuid-1', payload: { descricao: 'Nova descrição' } });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedApiClient.patch).toHaveBeenCalledWith(
      '/permissoes/perm-uuid-1',
      { descricao: 'Nova descrição' },
      { token: 'test-token' },
    );
    expect(mockedToast.success).toHaveBeenCalledWith('Permissão atualizada com sucesso!');
  });

  it('should include moduloId: null to unlink module when updating', async () => {
    const updated = makePermissao({ moduloId: null, modulo: null });
    mockedApiClient.patch.mockResolvedValue(updated);

    const { result } = renderHook(() => useUpdatePermissao(), { wrapper: createWrapper() });

    act(() => {
      result.current.mutate({ id: 'perm-uuid-1', payload: { moduloId: null } });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedApiClient.patch).toHaveBeenCalledWith(
      '/permissoes/perm-uuid-1',
      { moduloId: null },
      { token: 'test-token' },
    );
  });

  it('should show error toast when update fails', async () => {
    mockedApiClient.patch.mockRejectedValue(new Error('Permissão não encontrada'));

    const { result } = renderHook(() => useUpdatePermissao(), { wrapper: createWrapper() });

    act(() => {
      result.current.mutate({ id: 'nonexistent', payload: { nome: 'X' } });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(mockedToast.error).toHaveBeenCalledWith('Permissão não encontrada');
  });
});

describe('useDeletePermissao', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call apiClient.delete and show success toast', async () => {
    mockedApiClient.delete.mockResolvedValue(undefined);

    const { result } = renderHook(() => useDeletePermissao(), { wrapper: createWrapper() });

    act(() => {
      result.current.mutate('perm-uuid-1');
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedApiClient.delete).toHaveBeenCalledWith('/permissoes/perm-uuid-1', { token: 'test-token' });
    expect(mockedToast.success).toHaveBeenCalledWith('Permissão removida com sucesso!');
  });

  it('should show error toast when delete fails', async () => {
    mockedApiClient.delete.mockRejectedValue(new Error('Erro ao remover'));

    const { result } = renderHook(() => useDeletePermissao(), { wrapper: createWrapper() });

    act(() => {
      result.current.mutate('perm-uuid-1');
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(mockedToast.error).toHaveBeenCalledWith('Erro ao remover');
  });
});
