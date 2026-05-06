import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useAuditLogs } from './use-audit-logs';
import { apiClient } from '../lib/api-client';
import type { AuditLogDto, PaginatedResult } from '../types';

jest.mock('next-auth/react', () => ({
  useSession: jest.fn().mockReturnValue({
    data: { user: { accessToken: 'test-token' } },
    status: 'authenticated',
  }),
}));

jest.mock('../lib/api-client', () => ({
  apiClient: {
    get: jest.fn(),
  },
}));

const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>;

function makeAuditLog(overrides: Partial<AuditLogDto> = {}): AuditLogDto {
  return {
    id: 'log-uuid-1',
    usuarioId: 'user-uuid-1',
    acao: 'CRIAR',
    entidade: 'Document',
    entidadeId: 'doc-uuid-1',
    ipCliente: '127.0.0.1',
    userAgent: 'Mozilla/5.0',
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function makePaginatedResult(overrides: Partial<PaginatedResult<AuditLogDto>> = {}): PaginatedResult<AuditLogDto> {
  return {
    data: [makeAuditLog()],
    total: 1,
    page: 1,
    limit: 10,
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

describe('useAuditLogs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch audit logs without filters', async () => {
    const paginated = makePaginatedResult();
    mockedApiClient.get.mockResolvedValue(paginated);

    const { result } = renderHook(() => useAuditLogs(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.data).toHaveLength(1);
    expect(mockedApiClient.get).toHaveBeenCalledWith('/audit-logs', { token: 'test-token' });
  });

  it('should build query string when filters are provided', async () => {
    const paginated = makePaginatedResult({ total: 5 });
    mockedApiClient.get.mockResolvedValue(paginated);

    const { result } = renderHook(
      () => useAuditLogs({ acao: 'CRIAR', entidade: 'Document', page: 2, limit: 5 }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedApiClient.get).toHaveBeenCalledWith(
      '/audit-logs?acao=CRIAR&entidade=Document&page=2&limit=5',
      { token: 'test-token' },
    );
  });

  it('should filter by usuarioId when provided', async () => {
    const paginated = makePaginatedResult();
    mockedApiClient.get.mockResolvedValue(paginated);

    const { result } = renderHook(
      () => useAuditLogs({ usuarioId: 'user-uuid-1' }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedApiClient.get).toHaveBeenCalledWith(
      '/audit-logs?usuarioId=user-uuid-1',
      { token: 'test-token' },
    );
  });

  it('should set isError when fetch fails', async () => {
    mockedApiClient.get.mockRejectedValue(new Error('Unauthorized'));

    const { result } = renderHook(() => useAuditLogs(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
