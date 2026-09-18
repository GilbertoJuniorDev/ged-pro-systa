import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { UploadDocumentForm } from './upload-document-form';
import { useUploadDocument } from '../../hooks/use-documents';
import { useDepartments } from '../../hooks/use-departments';
import { useDocumentSeries } from '../../hooks/use-document-series';
import { useDossieOptions } from '../../hooks/use-dossies';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
}));

jest.mock('../../hooks/use-documents', () => ({
  useUploadDocument: jest.fn(),
}));

jest.mock('../../hooks/use-departments', () => ({
  useDepartments: jest.fn(),
}));

jest.mock('../../hooks/use-document-series', () => ({
  useDocumentSeries: jest.fn(),
}));

jest.mock('../../hooks/use-dossies', () => ({
  useDossieOptions: jest.fn(),
}));

jest.mock('../../hooks/use-users', () => ({
  useUsers: jest.fn().mockReturnValue({ data: [] }),
}));

const { useSession } = jest.requireMock('next-auth/react') as { useSession: jest.Mock };

const mockPush = jest.fn();
const mockMutate = jest.fn();

function setup({
  role = 'VIEWER',
  selectedDepartmentId,
}: { role?: string; selectedDepartmentId?: string } = {}) {
  (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
  (useUploadDocument as jest.Mock).mockReturnValue({ mutate: mockMutate, isPending: false });
  (useDepartments as jest.Mock).mockReturnValue({
    data: [{ id: 'dept-1', nome: 'Financeiro' }],
  });
  (useDocumentSeries as jest.Mock).mockReturnValue({
    data: [{ id: 'serie-1', codigo: 'FIN-01', nome: 'Contratos' }],
  });
  (useDossieOptions as jest.Mock).mockReturnValue({ data: [] });
  useSession.mockReturnValue({
    data: {
      user: {
        role,
        accessToken: 'test-token',
        selectedDepartmentId,
        departamentos: [{ id: 'dept-1', nome: 'Financeiro' }],
      },
    },
    status: 'authenticated',
  });
}

function attachFile(container: HTMLElement) {
  const fileInput = container.querySelector('input[type="file"]');
  if (!fileInput) throw new Error('file input not found');
  const file = new File(['conteudo'], 'contrato.pdf', { type: 'application/pdf' });
  fireEvent.change(fileInput, { target: { files: [file] } });
  return file;
}

describe('UploadDocumentForm', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('submits with only the file when no other field is filled (upload só repositório)', async () => {
    setup();
    const { container } = render(<UploadDocumentForm />);
    const file = attachFile(container);

    fireEvent.click(screen.getByRole('button', { name: 'Enviar Documento' }));

    await waitFor(() => expect(mockMutate).toHaveBeenCalledTimes(1));
    const [payload] = mockMutate.mock.calls[0] as [Record<string, unknown>, unknown];
    expect(payload.file).toBe(file);
    expect(payload).toMatchObject({
      nome: undefined,
      descricao: undefined,
      validade: undefined,
      departamentoId: undefined,
      serieId: undefined,
      dossieId: undefined,
      destaque: false,
      exigeCadastro: false,
      accessDepartamentoIds: [],
      accessUserIds: [],
    });
  });

  it('shows an error and does not submit when no file is attached', async () => {
    setup();
    render(<UploadDocumentForm />);

    fireEvent.click(screen.getByRole('button', { name: 'Enviar Documento' }));

    expect(await screen.findByText('Selecione um arquivo para enviar')).toBeInTheDocument();
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it('offers "Nenhum (apenas repositório)" as a department option and leaves the série combobox disabled until one is chosen', () => {
    setup({ role: 'ADMIN' });
    render(<UploadDocumentForm />);

    fireEvent.click(screen.getByRole('button', { name: 'Selecione o departamento' }));
    expect(screen.getByRole('option', { name: 'Nenhum (apenas repositório)' })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Selecione um departamento primeiro' }),
    ).toBeDisabled();
  });

  it('allows classifying the document by picking departamento then série', async () => {
    setup({ role: 'ADMIN' });
    const { container } = render(<UploadDocumentForm />);
    const file = attachFile(container);

    fireEvent.click(screen.getByRole('button', { name: 'Selecione o departamento' }));
    fireEvent.click(screen.getByRole('option', { name: 'Financeiro' }));

    const serieTrigger = screen.getByRole('button', { name: 'Selecione a série' });
    expect(serieTrigger).not.toBeDisabled();
    fireEvent.click(serieTrigger);
    fireEvent.click(screen.getByRole('option', { name: 'FIN-01 — Contratos' }));

    fireEvent.click(screen.getByRole('button', { name: 'Enviar Documento' }));

    await waitFor(() => expect(mockMutate).toHaveBeenCalledTimes(1));
    const [payload] = mockMutate.mock.calls[0] as [Record<string, unknown>, unknown];
    expect(payload.file).toBe(file);
    expect(payload).toMatchObject({
      departamentoId: 'dept-1',
      serieId: 'serie-1',
    });
  });
});
