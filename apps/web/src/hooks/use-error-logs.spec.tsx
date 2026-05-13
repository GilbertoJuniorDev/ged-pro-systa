import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useErrorLogs, type ErrorLogDto } from './use-error-logs';
import { apiClient } from '../lib/api-client';
import type { PaginatedResult } from '../types';

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

function makeErrorLog(overrides: Partial<ErrorLogDto> = {}): ErrorLogDto {
  return {
    id: 'log-1',
    source: 'api',
    level: 'error',
    message: 'boom',
    stack: null,
    code: null,
    statusCode: 500,
    method: 'GET',
    url: '/x',
    userAgent: null,
    ip: null,
    userId: null,
    userEmail: null,
    requestId: null,
    context: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function makePaginated(
  overrides: Partial<PaginatedResult<ErrorLogDto>> = {},
): PaginatedResult<ErrorLogDto> {
  return {
    data: [makeErrorLog()],
    total: 1,
    page: 1,
    limit: 20,
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

describe('useErrorLogs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch error logs without filters', async () => {
    mockedApiClient.get.mockResolvedValue(makePaginated());

    const { result } = renderHook(() => useErrorLogs(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.data).toHaveLength(1);
    expect(mockedApiClient.get).toHaveBeenCalledWith('/error-logs', {
      token: 'test-token',
    });
  });

  it('should build query string when filters are provided', async () => {
    mockedApiClient.get.mockResolvedValue(makePaginated({ total: 5 }));

    const { result } = renderHook(
      () =>
        useErrorLogs({
          source: 'api',
          level: 'error',
          statusCode: 500,
          page: 2,
          limit: 5,
        }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedApiClient.get).toHaveBeenCalledWith(
      '/error-logs?source=api&level=error&statusCode=500&page=2&limit=5',
      { token: 'test-token' },
    );
  });

  it('should include search and date range filters', async () => {
    mockedApiClient.get.mockResolvedValue(makePaginated());

    const { result } = renderHook(
      () =>
        useErrorLogs({
          search: 'boom',
          dateFrom: '2026-01-01',
          dateTo: '2026-01-31',
        }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedApiClient.get).toHaveBeenCalledWith(
      '/error-logs?search=boom&dateFrom=2026-01-01&dateTo=2026-01-31',
      { token: 'test-token' },
    );
  });

  it('should set isError when fetch fails', async () => {
    mockedApiClient.get.mockRejectedValue(new Error('Unauthorized'));

    const { result } = renderHook(() => useErrorLogs(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
