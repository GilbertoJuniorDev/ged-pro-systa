import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { toast } from 'sonner';
import {
  usePhysicalPerson,
  useCreatePhysicalPerson,
  useUpdatePhysicalPerson,
} from './use-physical-person';
import { apiClient } from '../lib/api-client';
import type { PhysicalPersonDto } from '../types';

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

function makePhysicalPerson(overrides: Partial<PhysicalPersonDto> = {}): PhysicalPersonDto {
  return {
    id: 'pf-uuid-1',
    userId: USER_ID,
    nome: 'João',
    sobrenome: 'Silva',
    cpf: '12345678901',
    dataNascimento: '1990-05-15',
    sexo: 'M',
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

describe('usePhysicalPerson', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch physical person data for a user', async () => {
    const pf = makePhysicalPerson();
    mockedApiClient.get.mockResolvedValue(pf);

    const { result } = renderHook(() => usePhysicalPerson(USER_ID), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.cpf).toBe('12345678901');
    expect(mockedApiClient.get).toHaveBeenCalledWith(
      `/users/${USER_ID}/physical-person`,
      { token: 'test-token' },
    );
  });

  it('should not retry on 404 error', async () => {
    const error = new Error('404 Não encontrado');
    mockedApiClient.get.mockRejectedValue(error);

    const { result } = renderHook(() => usePhysicalPerson(USER_ID), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));

    // deve ter chamado apenas 1 vez (sem retry)
    expect(mockedApiClient.get).toHaveBeenCalledTimes(1);
  });
});

describe('useCreatePhysicalPerson', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call apiClient.post with correct payload and show success toast', async () => {
    const created = makePhysicalPerson();
    mockedApiClient.post.mockResolvedValue(created);

    const { result } = renderHook(() => useCreatePhysicalPerson(USER_ID), { wrapper: createWrapper() });

    act(() => {
      result.current.mutate({
        nome: 'João',
        sobrenome: 'Silva',
        cpf: '12345678901',
        dataNascimento: '1990-05-15',
        sexo: 'M',
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedApiClient.post).toHaveBeenCalledWith(
      `/users/${USER_ID}/physical-person`,
      { nome: 'João', sobrenome: 'Silva', cpf: '12345678901', dataNascimento: '1990-05-15', sexo: 'M' },
      { token: 'test-token' },
    );
    expect(mockedToast.success).toHaveBeenCalledWith('Perfil criado com sucesso!');
  });

  it('should show error toast when creation fails', async () => {
    mockedApiClient.post.mockRejectedValue(new Error('CPF já cadastrado'));

    const { result } = renderHook(() => useCreatePhysicalPerson(USER_ID), { wrapper: createWrapper() });

    act(() => {
      result.current.mutate({
        nome: 'João',
        sobrenome: 'Silva',
        cpf: '12345678901',
        dataNascimento: '1990-05-15',
        sexo: 'M',
      });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(mockedToast.error).toHaveBeenCalledWith('CPF já cadastrado');
  });
});

describe('useUpdatePhysicalPerson', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call apiClient.patch with partial payload and show success toast', async () => {
    const updated = makePhysicalPerson({ sobrenome: 'Santos' });
    mockedApiClient.patch.mockResolvedValue(updated);

    const { result } = renderHook(() => useUpdatePhysicalPerson(USER_ID), { wrapper: createWrapper() });

    act(() => {
      result.current.mutate({ sobrenome: 'Santos' });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedApiClient.patch).toHaveBeenCalledWith(
      `/users/${USER_ID}/physical-person`,
      { sobrenome: 'Santos' },
      { token: 'test-token' },
    );
    expect(mockedToast.success).toHaveBeenCalledWith('Perfil atualizado com sucesso!');
  });

  it('should show error toast when update fails', async () => {
    mockedApiClient.patch.mockRejectedValue(new Error('Perfil não encontrado'));

    const { result } = renderHook(() => useUpdatePhysicalPerson(USER_ID), { wrapper: createWrapper() });

    act(() => {
      result.current.mutate({ nome: 'X' });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(mockedToast.error).toHaveBeenCalledWith('Perfil não encontrado');
  });
});
