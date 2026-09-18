import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { toast } from 'sonner';
import {
  useDossies,
  useDossie,
  useDossieOptions,
  useCreateDossie,
  useUpdateDossie,
  useDeleteDossie,
} from './use-dossies';
import { apiClient } from '../lib/api-client';
import type { DossieDto, PaginatedResult } from '../types';

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

function makeDossie(overrides: Partial<DossieDto> = {}): DossieDto {
  return {
    id: 'dossie-1',
    nome: 'Contratos 2026',
    descricao: null,
    isActive: true,
    departamentoId: 'dept-1',
    arquivoId: null,
    documentsCount: 0,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function makePaginatedResult(
  overrides: Partial<PaginatedResult<DossieDto>> = {},
): PaginatedResult<DossieDto> {
  return { data: [makeDossie()], total: 1, page: 1, limit: 20, ...overrides };
}

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('useDossies', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch dossies without filters', async () => {
    mockedApiClient.get.mockResolvedValue(makePaginatedResult());

    const { result } = renderHook(() => useDossies(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockedApiClient.get).toHaveBeenCalledWith('/dossies', { token: 'test-token' });
  });

  it('should build the query string with arquivoId, semArquivo, search, page and limit', async () => {
    mockedApiClient.get.mockResolvedValue(makePaginatedResult());

    const { result } = renderHook(
      () =>
        useDossies({
          departamentoId: 'dept-1',
          arquivoId: 'arquivo-1',
          semArquivo: true,
          search: 'contrato',
          page: 2,
          limit: 10,
        }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockedApiClient.get).toHaveBeenCalledWith(
      '/dossies?departamentoId=dept-1&arquivoId=arquivo-1&semArquivo=true&search=contrato&page=2&limit=10',
      { token: 'test-token' },
    );
  });

  it('should omit semArquivo from the query string when false', async () => {
    mockedApiClient.get.mockResolvedValue(makePaginatedResult());

    const { result } = renderHook(() => useDossies({ semArquivo: false }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockedApiClient.get).toHaveBeenCalledWith('/dossies', { token: 'test-token' });
  });
});

describe('useDossie', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch a single dossiê when id is provided', async () => {
    mockedApiClient.get.mockResolvedValue(makeDossie());

    const { result } = renderHook(() => useDossie('dossie-1'), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockedApiClient.get).toHaveBeenCalledWith('/dossies/dossie-1', { token: 'test-token' });
  });

  it('should not fetch when id is undefined', () => {
    renderHook(() => useDossie(undefined), { wrapper: createWrapper() });
    expect(mockedApiClient.get).not.toHaveBeenCalled();
  });
});

describe('useDossieOptions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should unwrap the paginated result into a plain array capped at 100', async () => {
    const dossies = [makeDossie(), makeDossie({ id: 'dossie-2' })];
    mockedApiClient.get.mockResolvedValue({ data: dossies, total: 2, page: 1, limit: 100 });

    const { result } = renderHook(() => useDossieOptions('dept-1'), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.data).toEqual(dossies));
    expect(mockedApiClient.get).toHaveBeenCalledWith('/dossies?departamentoId=dept-1&limit=100', {
      token: 'test-token',
    });
  });
});

describe('useCreateDossie', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should post to /dossies and toast success', async () => {
    mockedApiClient.post.mockResolvedValue(makeDossie());
    const { result } = renderHook(() => useCreateDossie(), { wrapper: createWrapper() });

    result.current.mutate({ nome: 'Contratos 2026', departamentoId: 'dept-1' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(toast.success).toHaveBeenCalledWith('Dossiê criado com sucesso!');
  });

  it('should toast an error message on failure', async () => {
    mockedApiClient.post.mockRejectedValue(new Error('Departamento não encontrado'));
    const { result } = renderHook(() => useCreateDossie(), { wrapper: createWrapper() });

    result.current.mutate({ nome: 'Contratos 2026', departamentoId: 'dept-1' });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(toast.error).toHaveBeenCalledWith('Departamento não encontrado');
  });
});

describe('useUpdateDossie', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should patch /dossies/:id and toast success', async () => {
    mockedApiClient.patch.mockResolvedValue(makeDossie({ nome: 'Contratos 2026 v2' }));
    const { result } = renderHook(() => useUpdateDossie(), { wrapper: createWrapper() });

    result.current.mutate({ id: 'dossie-1', payload: { nome: 'Contratos 2026 v2' } });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockedApiClient.patch).toHaveBeenCalledWith(
      '/dossies/dossie-1',
      { nome: 'Contratos 2026 v2' },
      { token: 'test-token' },
    );
    expect(toast.success).toHaveBeenCalledWith('Dossiê atualizado com sucesso!');
  });
});

describe('useDeleteDossie', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should delete /dossies/:id and toast success', async () => {
    mockedApiClient.delete.mockResolvedValue(undefined);
    const { result } = renderHook(() => useDeleteDossie(), { wrapper: createWrapper() });

    result.current.mutate('dossie-1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockedApiClient.delete).toHaveBeenCalledWith('/dossies/dossie-1', {
      token: 'test-token',
    });
    expect(toast.success).toHaveBeenCalledWith('Dossiê removido com sucesso!');
  });
});
