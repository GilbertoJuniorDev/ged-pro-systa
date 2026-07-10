import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { toast } from 'sonner';
import {
  usePublicDocuments,
  usePublicDestaques,
  usePublicRecentes,
  usePublicDocument,
  usePublicSeries,
  useRegisterAccess,
} from './use-public-documents';
import { apiClient } from '../lib/api-client';
import type { PublicDocumentDto } from '../types';

jest.mock('../lib/api-client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>;
const mockedToast = toast as jest.Mocked<typeof toast>;

function makePublicDocumentDto(overrides: Partial<PublicDocumentDto> = {}): PublicDocumentDto {
  return {
    id: 'doc-1',
    nome: 'Documento Público',
    descricao: null,
    arquivoNome: 'documento.pdf',
    arquivoMimeType: 'application/pdf',
    arquivoTamanho: 1024,
    serie: { id: 'serie-1', codigo: 'S1', nome: 'Série 1' },
    destaque: false,
    exigeCadastro: false,
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

describe('usePublicDocuments', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch documents without a token and without an enabled gate', async () => {
    const paginated = { data: [makePublicDocumentDto()], total: 1, page: 1, limit: 12 };
    mockedApiClient.get.mockResolvedValue(paginated);

    const { result } = renderHook(() => usePublicDocuments({ search: 'ata', page: 1, limit: 12 }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(paginated);
    expect(mockedApiClient.get).toHaveBeenCalledWith('/public/documents?search=ata&page=1&limit=12');
    // Garante que nenhum { token } foi passado (assinatura pública, sem 2º argumento).
    expect(mockedApiClient.get).toHaveBeenCalledTimes(1);
    expect(mockedApiClient.get.mock.calls[0]).toHaveLength(1);
  });

  it('should set isError when fetch fails', async () => {
    mockedApiClient.get.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => usePublicDocuments(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('usePublicDestaques', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch the plain array of highlighted documents', async () => {
    const destaques = [makePublicDocumentDto({ destaque: true })];
    mockedApiClient.get.mockResolvedValue(destaques);

    const { result } = renderHook(() => usePublicDestaques(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(destaques);
    expect(mockedApiClient.get).toHaveBeenCalledWith('/public/documents/destaques');
  });
});

describe('usePublicRecentes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should append limit to the query string when provided', async () => {
    mockedApiClient.get.mockResolvedValue([]);

    const { result } = renderHook(() => usePublicRecentes(5), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedApiClient.get).toHaveBeenCalledWith('/public/documents/recentes?limit=5');
  });

  it('should omit the query string when limit is not provided', async () => {
    mockedApiClient.get.mockResolvedValue([]);

    const { result } = renderHook(() => usePublicRecentes(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedApiClient.get).toHaveBeenCalledWith('/public/documents/recentes');
  });
});

describe('usePublicDocument', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should only be enabled when an id is provided', () => {
    const { result } = renderHook(() => usePublicDocument(undefined), { wrapper: createWrapper() });

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockedApiClient.get).not.toHaveBeenCalled();
  });

  it('should fetch the document detail when id is provided', async () => {
    const doc = makePublicDocumentDto();
    mockedApiClient.get.mockResolvedValue(doc);

    const { result } = renderHook(() => usePublicDocument('doc-1'), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedApiClient.get).toHaveBeenCalledWith('/public/documents/doc-1');
  });
});

describe('usePublicSeries', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch the full list of available séries without a token', async () => {
    const series = [{ id: 'serie-1', codigo: 'FIN-01', nome: 'Contratos financeiros' }];
    mockedApiClient.get.mockResolvedValue(series);

    const { result } = renderHook(() => usePublicSeries(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(series);
    expect(mockedApiClient.get).toHaveBeenCalledWith('/public/documents/series');
    expect(mockedApiClient.get.mock.calls[0]).toHaveLength(1);
  });
});

describe('useRegisterAccess', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should post registration data and resolve with a download token', async () => {
    mockedApiClient.post.mockResolvedValue({ downloadToken: 'tok-123' });

    const { result } = renderHook(() => useRegisterAccess(), { wrapper: createWrapper() });

    const input = { email: 'a@b.com', nome: 'Fulano', documento: '52998224725', tipoDocumento: 'CPF' as const };

    act(() => {
      result.current.mutate({ documentId: 'doc-1', input });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedApiClient.post).toHaveBeenCalledWith('/public/documents/doc-1/acesso', input);
    expect(result.current.data).toEqual({ downloadToken: 'tok-123' });
  });

  it('should call toast.error when registration fails', async () => {
    mockedApiClient.post.mockRejectedValue(new Error('documento inválido para o tipoDocumento informado'));

    const { result } = renderHook(() => useRegisterAccess(), { wrapper: createWrapper() });

    act(() => {
      result.current.mutate({
        documentId: 'doc-1',
        input: { email: 'a@b.com', nome: 'Fulano', documento: '000', tipoDocumento: 'CPF' as const },
      });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(mockedToast.error).toHaveBeenCalledWith('documento inválido para o tipoDocumento informado');
  });
});
