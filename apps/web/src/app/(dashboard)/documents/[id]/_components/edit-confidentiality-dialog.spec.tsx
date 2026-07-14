import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import type { DocumentDto } from '@/types';
import { useUpdateDocument } from '@/hooks/use-documents';
import { EditConfidentialityDialog } from './edit-confidentiality-dialog';

jest.mock('next-auth/react', () => ({
  useSession: jest.fn().mockReturnValue({
    data: { user: { id: 'user-1', accessToken: 'test-token', role: 'ADMIN', permissoes: [], modulos: [] } },
    status: 'authenticated',
  }),
}));

jest.mock('@/hooks/use-documents', () => ({
  useUpdateDocument: jest.fn(),
}));

jest.mock('@/hooks/use-departments', () => ({
  useDepartments: jest.fn().mockReturnValue({
    data: [
      { id: '11111111-1111-4111-8111-111111111111', nome: 'Financeiro' },
      { id: '22222222-2222-4222-8222-222222222222', nome: 'Jurídico' },
    ],
  }),
}));

jest.mock('@/hooks/use-users', () => ({
  useUsers: jest.fn().mockReturnValue({
    data: [
      { id: '33333333-3333-4333-8333-333333333333', name: 'Ana Souza', email: 'ana@test.com' },
      { id: '44444444-4444-4444-8444-444444444444', name: 'Bruno Lima', email: 'bruno@test.com' },
    ],
  }),
}));

const mockMutate = jest.fn();

const DOC_ID = '99999999-9999-4999-8999-999999999999';
const DEPARTAMENTO_ID = '11111111-1111-4111-8111-111111111111';
const DEPARTAMENTO_EXTRA_ID = '22222222-2222-4222-8222-222222222222';
const SERIE_ID = '55555555-5555-4555-8555-555555555555';

function baseDocument(overrides?: Partial<DocumentDto>): DocumentDto {
  return {
    id: DOC_ID,
    nome: 'Contrato de Prestação de Serviços',
    descricao: null,
    validade: null,
    confidencialidade: 'RESTRITO',
    departamentoId: DEPARTAMENTO_ID,
    serieId: SERIE_ID,
    dossieId: null,
    fase: 'CORRENTE',
    faseCorrenteDesde: '2026-01-01T00:00:00.000Z',
    faseIntermediarioDesde: null,
    arquivoNome: 'contrato.pdf',
    arquivoMimeType: 'application/pdf',
    arquivoTamanho: 1024,
    isActive: true,
    vencimentoCorrente: '2027-01-01T00:00:00.000Z',
    vencimentoIntermediario: null,
    elegivelTransferencia: false,
    destaque: false,
    exigeCadastro: false,
    acessoDepartamentoIds: [DEPARTAMENTO_EXTRA_ID],
    acessoUsuarioIds: [],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('EditConfidentialityDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useUpdateDocument as jest.Mock).mockReturnValue({
      mutate: mockMutate,
      isPending: false,
    });
  });

  it('renders as a modal dialog pre-filled with the document current confidentiality state', () => {
    render(<EditConfidentialityDialog document={baseDocument()} onClose={jest.fn()} />);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(screen.getByText('Alterar confidencialidade')).toBeInTheDocument();
    expect(screen.getByText('"Contrato de Prestação de Serviços"')).toBeInTheDocument();

    // Nível pré-selecionado: Restrito.
    expect(screen.getByRole('button', { name: 'Restrito' })).toBeInTheDocument();
    // Departamento adicional pré-selecionado (dep-2 = Jurídico) exibido como chip.
    expect(screen.getByText('Departamentos adicionais com acesso')).toBeInTheDocument();
    expect(screen.getByText('Jurídico')).toBeInTheDocument();
  });

  it('submits the edited payload via useUpdateDocument().mutate and closes the dialog on success', async () => {
    const onClose = jest.fn();
    mockMutate.mockImplementation((_vars, opts: { onSuccess?: () => void } | undefined) => {
      opts?.onSuccess?.();
    });

    render(<EditConfidentialityDialog document={baseDocument()} onClose={onClose} />);

    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith(
        {
          id: DOC_ID,
          payload: {
            confidencialidade: 'RESTRITO',
            accessDepartamentoIds: [DEPARTAMENTO_EXTRA_ID],
            accessUserIds: [],
            exigeCadastro: false,
            destaque: false,
          },
        },
        expect.objectContaining({ onSuccess: expect.any(Function) }),
      );
    });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose without mutating when Cancelar is clicked', () => {
    const onClose = jest.fn();
    render(<EditConfidentialityDialog document={baseDocument()} onClose={onClose} />);

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it('calls onClose without mutating when the close (X) button is clicked', () => {
    const onClose = jest.fn();
    render(<EditConfidentialityDialog document={baseDocument()} onClose={onClose} />);

    fireEvent.click(screen.getByRole('button', { name: 'Fechar' }));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(mockMutate).not.toHaveBeenCalled();
  });
});
