import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { toast } from 'sonner';
import {
  useArquivos,
  useArquivo,
  useCreateArquivo,
  useUpdateArquivo,
  useEncerrarArquivo,
  useReabrirArquivo,
  useDeleteArquivo,
} from './use-arquivos';
import { apiClient } from '../lib/api-client';
import type { ArquivoDto, PaginatedResult } from '../types';

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
  toast: { success: jest.fn(), error: jest.fn() },
}));

const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>;

function makeArquivo(overrides: Partial<ArquivoDto> = {}): ArquivoDto {
  return {
    id: 'arquivo-1',
    codigo: '2026-001',
    ano: 2026,
    sequencia: 1,
    nome: 'Contratos 2026',
    descricao: null,
    status: 'ABERTO',
    dataEncerramento: null,
    encerradoPorId: null,
    predio: null,
    sala: null,
    estante: null,
    prateleira: null,
    caixa: null,
    departamentoId: 'dept-1',
    departamentoIds: [],
    dossiesCount: 0,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function makePaginatedResult(
  overrides: Partial<PaginatedResult<ArquivoDto>> = {},
): PaginatedResult<ArquivoDto> {
  return { data: [makeArquivo()], total: 1, page: 1, limit: 20, ...overrides };
}

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('useArquivos', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch arquivos without filters', async () => {
    mockedApiClient.get.mockResolvedValue(makePaginatedResult());

    const { result } = renderHook(() => useArquivos(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockedApiClient.get).toHaveBeenCalledWith('/arquivos', { token: 'test-token' });
  });

  it('should build query string when filters are provided', async () => {
    mockedApiClient.get.mockResolvedValue(makePaginatedResult());

    const { result } = renderHook(
      () => useArquivos({ departamentoId: 'dept-1', status: 'ABERTO', page: 2, limit: 10 }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockedApiClient.get).toHaveBeenCalledWith(
      '/arquivos?departamentoId=dept-1&status=ABERTO&page=2&limit=10',
      { token: 'test-token' },
    );
  });
});

describe('useArquivo', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch a single arquivo when id is provided', async () => {
    mockedApiClient.get.mockResolvedValue(makeArquivo());

    const { result } = renderHook(() => useArquivo('arquivo-1'), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockedApiClient.get).toHaveBeenCalledWith('/arquivos/arquivo-1', {
      token: 'test-token',
    });
  });

  it('should not fetch when id is undefined', () => {
    renderHook(() => useArquivo(undefined), { wrapper: createWrapper() });
    expect(mockedApiClient.get).not.toHaveBeenCalled();
  });
});

describe('useCreateArquivo', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should post to /arquivos and toast success', async () => {
    mockedApiClient.post.mockResolvedValue(makeArquivo());
    const { result } = renderHook(() => useCreateArquivo(), { wrapper: createWrapper() });

    await act(async () => {
      await result.current.mutateAsync({ nome: 'Contratos 2026', departamentoId: 'dept-1' });
    });

    expect(mockedApiClient.post).toHaveBeenCalledWith(
      '/arquivos',
      { nome: 'Contratos 2026', departamentoId: 'dept-1' },
      { token: 'test-token' },
    );
    expect(toast.success).toHaveBeenCalled();
  });

  it('should toast error when the request fails', async () => {
    mockedApiClient.post.mockRejectedValue(new Error('Departamento não encontrado'));
    const { result } = renderHook(() => useCreateArquivo(), { wrapper: createWrapper() });

    await act(async () => {
      await result.current.mutateAsync({ nome: 'x', departamentoId: 'dept-1' }).catch(() => {});
    });

    expect(toast.error).toHaveBeenCalledWith('Departamento não encontrado');
  });
});

describe('useUpdateArquivo', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should patch /arquivos/:id', async () => {
    mockedApiClient.patch.mockResolvedValue(makeArquivo({ nome: 'Novo nome' }));
    const { result } = renderHook(() => useUpdateArquivo(), { wrapper: createWrapper() });

    await act(async () => {
      await result.current.mutateAsync({ id: 'arquivo-1', payload: { nome: 'Novo nome' } });
    });

    expect(mockedApiClient.patch).toHaveBeenCalledWith(
      '/arquivos/arquivo-1',
      { nome: 'Novo nome' },
      { token: 'test-token' },
    );
  });
});

describe('useEncerrarArquivo / useReabrirArquivo', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should patch the encerrar endpoint', async () => {
    mockedApiClient.patch.mockResolvedValue(makeArquivo({ status: 'FECHADO' }));
    const { result } = renderHook(() => useEncerrarArquivo(), { wrapper: createWrapper() });

    await act(async () => {
      await result.current.mutateAsync('arquivo-1');
    });

    expect(mockedApiClient.patch).toHaveBeenCalledWith('/arquivos/arquivo-1/encerrar', undefined, {
      token: 'test-token',
    });
  });

  it('should patch the reabrir endpoint', async () => {
    mockedApiClient.patch.mockResolvedValue(makeArquivo({ status: 'ABERTO' }));
    const { result } = renderHook(() => useReabrirArquivo(), { wrapper: createWrapper() });

    await act(async () => {
      await result.current.mutateAsync('arquivo-1');
    });

    expect(mockedApiClient.patch).toHaveBeenCalledWith('/arquivos/arquivo-1/reabrir', undefined, {
      token: 'test-token',
    });
  });
});

describe('useDeleteArquivo', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should delete /arquivos/:id and toast success', async () => {
    mockedApiClient.delete.mockResolvedValue(undefined);
    const { result } = renderHook(() => useDeleteArquivo(), { wrapper: createWrapper() });

    await act(async () => {
      await result.current.mutateAsync('arquivo-1');
    });

    expect(mockedApiClient.delete).toHaveBeenCalledWith('/arquivos/arquivo-1', {
      token: 'test-token',
    });
    expect(toast.success).toHaveBeenCalled();
  });
});
