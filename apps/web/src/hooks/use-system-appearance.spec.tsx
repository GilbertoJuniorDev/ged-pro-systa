import type { ReactNode } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { revalidateAppearanceCache } from '@/lib/actions/revalidate-appearance';
import { useUpdateSystemAppearance, useUploadSystemLogo } from './use-system-appearance';

jest.mock('@/lib/api-client', () => ({
  apiClient: { get: jest.fn(), put: jest.fn(), post: jest.fn(), delete: jest.fn() },
}));

jest.mock('@/lib/actions/revalidate-appearance', () => ({
  revalidateAppearanceCache: jest.fn().mockResolvedValue(undefined),
}));

const mockRefresh = jest.fn();
jest.mock('next/navigation', () => ({ useRouter: () => ({ refresh: mockRefresh }) }));

jest.mock('next-auth/react', () => ({
  useSession: () => ({ data: { user: { accessToken: 'token-123' } } }),
}));

const mockToastSuccess = jest.fn();
const mockToastError = jest.fn();
jest.mock('sonner', () => ({
  toast: {
    success: (msg: string) => mockToastSuccess(msg),
    error: (msg: string) => mockToastError(msg),
  },
}));

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

const PAYLOAD = {
  primaryColor: '#16a34a',
  secondaryColor: '#0ea5e9',
  backgroundColor: '#0f172a',
  useDefaultTheme: false,
};

describe('useUpdateSystemAppearance', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(apiClient.put).mockResolvedValue(undefined);
  });

  it('envia as cores para a rota do admin com o token da sessão', async () => {
    const { result } = renderHook(() => useUpdateSystemAppearance(), { wrapper });

    result.current.mutate(PAYLOAD);

    await waitFor(() => expect(apiClient.put).toHaveBeenCalled());
    expect(apiClient.put).toHaveBeenCalledWith('/admin/appearance/system', PAYLOAD, {
      token: 'token-123',
    });
  });

  // Este é o defeito central do relato "salvo e não muda nada": invalidar só o React Query
  // atualiza o formulário, mas as cores na tela vêm do <style> que o RootLayout renderiza
  // no servidor a partir de um fetch cacheado. Sem invalidar o Data Cache e re-renderizar,
  // o admin recebe o toast de sucesso e a tela continua igual.
  it('invalida o cache do servidor e força o re-render após salvar', async () => {
    const { result } = renderHook(() => useUpdateSystemAppearance(), { wrapper });

    result.current.mutate(PAYLOAD);

    await waitFor(() => expect(mockRefresh).toHaveBeenCalled());
    expect(revalidateAppearanceCache).toHaveBeenCalledWith('system');
  });

  it('revalida o cache ANTES de pedir o re-render', async () => {
    const order: string[] = [];
    jest.mocked(revalidateAppearanceCache).mockImplementation(async () => {
      order.push('revalidate');
    });
    mockRefresh.mockImplementation(() => order.push('refresh'));

    const { result } = renderHook(() => useUpdateSystemAppearance(), { wrapper });
    result.current.mutate(PAYLOAD);

    await waitFor(() => expect(order).toHaveLength(2));
    // Invertido, o layout re-renderizaria contra o cache velho e repintaria a cor antiga.
    expect(order).toEqual(['revalidate', 'refresh']);
  });

  it('avisa o usuário quando a API recusa', async () => {
    jest.mocked(apiClient.put).mockRejectedValue(new Error('Cor inválida'));

    const { result } = renderHook(() => useUpdateSystemAppearance(), { wrapper });
    result.current.mutate(PAYLOAD);

    await waitFor(() => expect(mockToastError).toHaveBeenCalledWith('Cor inválida'));
    expect(mockRefresh).not.toHaveBeenCalled();
  });
});

describe('useUploadSystemLogo', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(apiClient.post).mockResolvedValue(undefined);
  });

  it('envia o arquivo como multipart no campo `logo`', async () => {
    const { result } = renderHook(() => useUploadSystemLogo(), { wrapper });
    const file = new File(['bin'], 'logo.png', { type: 'image/png' });

    result.current.mutate(file);

    await waitFor(() => expect(apiClient.post).toHaveBeenCalled());
    const [path, body] = jest.mocked(apiClient.post).mock.calls[0];
    expect(path).toBe('/admin/appearance/system/logo');
    expect(body).toBeInstanceOf(FormData);
    expect((body as FormData).get('logo')).toBe(file);
  });

  it('também revalida o cache do servidor após o upload', async () => {
    const { result } = renderHook(() => useUploadSystemLogo(), { wrapper });

    result.current.mutate(new File(['bin'], 'logo.png', { type: 'image/png' }));

    await waitFor(() => expect(revalidateAppearanceCache).toHaveBeenCalledWith('system'));
  });
});
