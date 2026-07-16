import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import { useDashboardSummary, useDashboardAdminSummary } from './use-dashboard';
import { apiClient } from '../lib/api-client';
import type { DashboardAdminSummaryDto, DashboardSummaryDto } from '../types';

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
}));

jest.mock('../lib/api-client', () => ({
  apiClient: {
    get: jest.fn(),
  },
}));

const mockedUseSession = useSession as jest.Mock;
const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>;

function makeDashboardSummary(overrides: Partial<DashboardSummaryDto> = {}): DashboardSummaryDto {
  return {
    totalDocumentos: 10,
    documentosPorFase: { corrente: 7, intermediario: 3 },
    documentosPorConfidencialidade: { publico: 5, restrito: 3, confidencial: 2 },
    documentosPorDestinacaoFinal: { guardaPermanente: 6, eliminacao: 4 },
    documentosElegiveisTransferencia: 1,
    armazenamentoTotalBytes: 1024,
    documentosCriadosPorMes: [{ mes: '2026-01', total: 10 }],
    ...overrides,
  };
}

function makeDashboardAdminSummary(
  overrides: Partial<DashboardAdminSummaryDto> = {},
): DashboardAdminSummaryDto {
  return {
    documentosPorDepartamento: [
      { departamentoId: 'dep-1', departamentoNome: 'Financeiro', totalDocumentos: 4 },
    ],
    totalUsuariosAtivos: 8,
    totalDepartamentos: 2,
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

describe('useDashboardSummary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch dashboard summary when session has an access token', async () => {
    mockedUseSession.mockReturnValue({
      data: { user: { accessToken: 'test-token' } },
      status: 'authenticated',
    });
    const summary = makeDashboardSummary();
    mockedApiClient.get.mockResolvedValue(summary);

    const { result } = renderHook(() => useDashboardSummary(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(summary);
    expect(mockedApiClient.get).toHaveBeenCalledWith('/dashboard/summary', {
      token: 'test-token',
    });
  });

  it('should stay disabled and not call the API when there is no session', () => {
    mockedUseSession.mockReturnValue({ data: undefined, status: 'unauthenticated' });

    const { result } = renderHook(() => useDashboardSummary(), { wrapper: createWrapper() });

    expect(result.current.fetchStatus).toBe('idle');
    expect(result.current.isPending).toBe(true);
    expect(mockedApiClient.get).not.toHaveBeenCalled();
  });

  it('should set isError when fetch fails', async () => {
    mockedUseSession.mockReturnValue({
      data: { user: { accessToken: 'test-token' } },
      status: 'authenticated',
    });
    mockedApiClient.get.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useDashboardSummary(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useDashboardAdminSummary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch admin summary for an ADMIN session', async () => {
    mockedUseSession.mockReturnValue({
      data: { user: { accessToken: 'test-token', role: 'ADMIN' } },
      status: 'authenticated',
    });
    const adminSummary = makeDashboardAdminSummary();
    mockedApiClient.get.mockResolvedValue(adminSummary);

    const { result } = renderHook(() => useDashboardAdminSummary(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(adminSummary);
    expect(mockedApiClient.get).toHaveBeenCalledWith('/dashboard/admin-summary', {
      token: 'test-token',
    });
  });

  it('should fetch admin summary for a SUPER_ADMIN session', async () => {
    mockedUseSession.mockReturnValue({
      data: { user: { accessToken: 'test-token', role: 'SUPER_ADMIN' } },
      status: 'authenticated',
    });
    const adminSummary = makeDashboardAdminSummary({ totalDepartamentos: 5 });
    mockedApiClient.get.mockResolvedValue(adminSummary);

    const { result } = renderHook(() => useDashboardAdminSummary(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(adminSummary);
  });

  it('should stay disabled for a VIEWER session', () => {
    mockedUseSession.mockReturnValue({
      data: { user: { accessToken: 'test-token', role: 'VIEWER' } },
      status: 'authenticated',
    });

    const { result } = renderHook(() => useDashboardAdminSummary(), { wrapper: createWrapper() });

    expect(result.current.fetchStatus).toBe('idle');
    expect(result.current.isPending).toBe(true);
    expect(mockedApiClient.get).not.toHaveBeenCalled();
  });

  it('should stay disabled when there is no session', () => {
    mockedUseSession.mockReturnValue({ data: undefined, status: 'unauthenticated' });

    const { result } = renderHook(() => useDashboardAdminSummary(), { wrapper: createWrapper() });

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockedApiClient.get).not.toHaveBeenCalled();
  });
});
