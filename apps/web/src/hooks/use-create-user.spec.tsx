import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { toast } from 'sonner';
import { useCreateUser } from './use-create-user';
import { apiClient } from '../lib/api-client';

jest.mock('next-auth/react', () => ({
  useSession: jest.fn().mockReturnValue({
    data: { user: { accessToken: 'test-token' } },
    status: 'authenticated',
  }),
}));

jest.mock('../lib/api-client', () => ({
  apiClient: {
    post: jest.fn(),
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

const mockPessoaFisica = {
  nome: 'Ana',
  sobrenome: 'Souza',
  cpf: '12345678901',
  dataNascimento: '1990-05-15',
  sexo: 'F' as const,
};

const mockPayload = {
  name: 'Ana',
  email: 'ana@test.com',
  password: 'Password123',
  role: 'VIEWER',
  pessoaFisica: mockPessoaFisica,
};

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('useCreateUser', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call apiClient.post with correct payload on mutation', async () => {
    const mockResponse = {
      success: true,
      data: { id: 'uuid-1', name: 'Ana', email: 'ana@test.com', role: 'VIEWER', isActive: true, createdAt: '2026-01-01' },
      message: 'Usuário criado',
      timestamp: new Date().toISOString(),
    };
    mockedApiClient.post.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useCreateUser(), { wrapper: createWrapper() });

    result.current.mutate(mockPayload);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedApiClient.post).toHaveBeenCalledWith(
      '/users',
      mockPayload,
      { token: 'test-token' },
    );
  });

  it('should include pessoaFisica in the request payload', async () => {
    const mockResponse = {
      success: true,
      data: { id: 'uuid-1', name: 'Ana', email: 'ana@test.com', role: 'VIEWER', isActive: true, createdAt: '2026-01-01' },
      message: 'Usuário criado',
      timestamp: new Date().toISOString(),
    };
    mockedApiClient.post.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useCreateUser(), { wrapper: createWrapper() });

    result.current.mutate(mockPayload);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const [, sentPayload] = mockedApiClient.post.mock.calls[0] as [string, typeof mockPayload, unknown];
    expect(sentPayload.pessoaFisica).toEqual(mockPessoaFisica);
  });

  it('should call toast.success when mutation succeeds', async () => {
    const mockResponse = {
      success: true,
      data: { id: 'uuid-1', name: 'Ana', email: 'ana@test.com', role: 'VIEWER', isActive: true, createdAt: '2026-01-01' },
      message: 'Usuário criado',
      timestamp: new Date().toISOString(),
    };
    mockedApiClient.post.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useCreateUser(), { wrapper: createWrapper() });

    result.current.mutate(mockPayload);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedToast.success).toHaveBeenCalledWith('Usuário criado com sucesso!');
  });

  it('should call toast.error with API message when mutation fails', async () => {
    mockedApiClient.post.mockRejectedValue(
      Object.assign(new Error('E-mail já cadastrado'), { statusCode: 409, code: 'CONFLICT' }),
    );

    const { result } = renderHook(() => useCreateUser(), { wrapper: createWrapper() });

    result.current.mutate(mockPayload);

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(mockedToast.error).toHaveBeenCalledWith('E-mail já cadastrado');
  });

  it('should expose error when API returns 409 conflict', async () => {
    mockedApiClient.post.mockRejectedValue(
      Object.assign(new Error('E-mail já cadastrado'), { statusCode: 409, code: 'CONFLICT' }),
    );

    const { result } = renderHook(() => useCreateUser(), { wrapper: createWrapper() });

    result.current.mutate(mockPayload);

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeDefined();
    expect((result.current.error as Error).message).toBe('E-mail já cadastrado');
  });

  it('should call toast.error with CPF conflict message', async () => {
    mockedApiClient.post.mockRejectedValue(
      Object.assign(new Error('CPF já cadastrado'), { statusCode: 409, code: 'CONFLICT' }),
    );

    const { result } = renderHook(() => useCreateUser(), { wrapper: createWrapper() });

    result.current.mutate(mockPayload);

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(mockedToast.error).toHaveBeenCalledWith('CPF já cadastrado');
  });

  it('should expose error when API returns 403 forbidden', async () => {
    mockedApiClient.post.mockRejectedValue(
      Object.assign(new Error('Acesso negado: permissão insuficiente'), { statusCode: 403, code: 'FORBIDDEN' }),
    );

    const { result } = renderHook(() => useCreateUser(), { wrapper: createWrapper() });

    result.current.mutate(mockPayload);

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect((result.current.error as Error).message).toBe('Acesso negado: permissão insuficiente');
  });
});
