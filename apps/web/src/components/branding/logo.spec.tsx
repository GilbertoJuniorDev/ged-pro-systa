import { render, screen } from '@testing-library/react';
import { Logo } from './logo';

// Em produção o logo sempre aponta para a API por URL absoluta (o binário não é servido
// pelo Next). Sem isto o teste exercitaria o caminho degradado de URL relativa, que só
// ocorre quando a env var falta — e next/image trata esse caso como imagem local.
process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3333';

const mockSystem = jest.fn();
const mockPortal = jest.fn();

jest.mock('@/hooks/use-public-appearance', () => ({
  usePublicSystemAppearance: (enabled: boolean) => mockSystem(enabled),
  usePublicPortalAppearance: (enabled: boolean) => mockPortal(enabled),
}));

describe('Logo', () => {
  beforeEach(() => {
    mockSystem.mockReset().mockReturnValue({ data: undefined });
    mockPortal.mockReset().mockReturnValue({ data: undefined });
  });

  it('usa a marca embutida quando não há logo configurado', () => {
    render(<Logo scope="system" />);

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByText('GED Pro')).toBeInTheDocument();
  });

  it('busca só o escopo exibido — o outro fica desabilitado', () => {
    render(<Logo scope="portal" />);

    expect(mockSystem).toHaveBeenCalledWith(false);
    expect(mockPortal).toHaveBeenCalledWith(true);
  });

  it('inclui o logoVersion na URL para invalidar o cache imutável da API', () => {
    mockSystem.mockReturnValue({ data: { hasLogo: true, logoVersion: 7 } });

    render(<Logo scope="system" />);

    expect(screen.getByRole('img')).toHaveAttribute('src', expect.stringContaining('v=7'));
  });

  // O binário do logo é servido com `Cache-Control: immutable, max-age=1 ano`, então o
  // `?v=` é a única coisa que faz o browser buscar a imagem nova depois de um upload.
  it('aponta para a rota pública do escopo pedido', () => {
    mockPortal.mockReturnValue({ data: { hasLogo: true, logoVersion: 1 } });

    render(<Logo scope="portal" />);

    expect(screen.getByRole('img')).toHaveAttribute(
      'src',
      expect.stringContaining('/public/appearance/portal/logo'),
    );
  });

  // Regressão: com a otimização ligada, o servidor Next tentava buscar
  // NEXT_PUBLIC_API_URL (http://localhost:3333) de dentro do próprio container e o logo
  // nunca carregava em Docker. `unoptimized` faz o src sair intacto para o browser.
  it('serve o binário direto, sem passar pelo otimizador do Next', () => {
    mockSystem.mockReturnValue({ data: { hasLogo: true, logoVersion: 3 } });

    render(<Logo scope="system" />);

    expect(screen.getByRole('img').getAttribute('src')).not.toContain('/_next/image');
  });
});
