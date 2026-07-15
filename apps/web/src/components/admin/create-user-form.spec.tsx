import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { CreateUserForm } from './create-user-form';
import { useCreateUser } from '../../hooks/use-create-user';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('next-auth/react', () => ({
  useSession: jest.fn().mockReturnValue({
    data: { user: { role: 'ADMIN', accessToken: 'test-token' } },
    status: 'authenticated',
  }),
}));

jest.mock('../../hooks/use-create-user', () => ({
  useCreateUser: jest.fn(),
}));

jest.mock('../../hooks/use-departments', () => ({
  useDepartments: jest.fn().mockReturnValue({ data: [] }),
}));

jest.mock('../../hooks/use-modules', () => ({
  useModules: jest.fn().mockReturnValue({ data: [] }),
}));

jest.mock('../../hooks/use-permission-management', () => ({
  usePermissionsManagement: jest.fn().mockReturnValue({ data: [] }),
}));

const mockPush = jest.fn();
const mockMutateAsync = jest.fn();

function setup() {
  (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
  (useCreateUser as jest.Mock).mockReturnValue({
    mutateAsync: mockMutateAsync,
    isPending: false,
  });
}

function fillValidForm(overrides?: Partial<{
  email: string; password: string; confirmPassword: string;
  role: string; nome: string; sobrenome: string; cpf: string;
  dataNascimento: string; sexo: string;
}>) {
  const data = {
    email: 'ana@test.com',
    password: 'Password123',
    confirmPassword: 'Password123',
    role: 'VIEWER',
    nome: 'Ana',
    sobrenome: 'Souza',
    cpf: '12345678901',
    dataNascimento: '1990-05-15',
    sexo: 'F',
    ...overrides,
  };

  fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: data.email } });
  fireEvent.change(screen.getByLabelText('Senha'), { target: { value: data.password } });
  fireEvent.change(screen.getByLabelText('Confirmar senha'), { target: { value: data.confirmPassword } });
  fireEvent.change(screen.getByLabelText('Nome'), { target: { value: data.nome } });
  fireEvent.change(screen.getByLabelText('Sobrenome'), { target: { value: data.sobrenome } });
  fireEvent.change(screen.getByLabelText(/CPF/), { target: { value: data.cpf } });
  setDataNascimento(data.dataNascimento);
  setSexo(data.sexo);
}

/** dataNascimento no formato YYYY-MM-DD */
function setDataNascimento(dataNascimento: string) {
  const [year, month, day] = dataNascimento.split('-').map(Number);
  const MONTHS_SHORT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  fireEvent.click(screen.getByLabelText('Data de nascimento'));
  const toggleView = screen.getByLabelText('Alternar visualização do calendário');
  fireEvent.click(toggleView); // days -> months
  fireEvent.click(toggleView); // months -> years

  // O range de anos exibido é centrado no ano atual — navega até o ano alvo entrar no range.
  for (let guard = 0; guard < 30; guard++) {
    const [rangeStart, rangeEnd] = (screen.getByText(/^\d{4}\s+–\s+\d{4}$/).textContent ?? '')
      .split('–')
      .map((s) => Number(s.trim()));
    if (year >= rangeStart && year <= rangeEnd) break;
    fireEvent.click(screen.getByLabelText(year < rangeStart ? 'Anterior' : 'Próximo'));
  }

  fireEvent.click(screen.getByRole('button', { name: String(year) }));
  fireEvent.click(screen.getByRole('button', { name: MONTHS_SHORT[month - 1] }));
  fireEvent.click(screen.getByRole('button', { name: String(day) }));
}

function setSexo(sexo: string) {
  const SEXO_LABELS: Record<string, string> = { M: 'Masculino', F: 'Feminino', O: 'Outro' };
  fireEvent.click(screen.getByLabelText('Sexo'));
  fireEvent.click(screen.getByRole('option', { name: SEXO_LABELS[sexo] }));
}

describe('CreateUserForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setup();
  });

  it('should render all user fields and pessoa fisica fields', () => {
    render(<CreateUserForm />);

    expect(screen.queryByLabelText('Nome completo')).not.toBeInTheDocument();
    expect(screen.getByLabelText('E-mail')).toBeInTheDocument();
    expect(screen.getByLabelText('Senha')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirmar senha')).toBeInTheDocument();
    expect(screen.getByLabelText('Função')).toBeInTheDocument();
    expect(screen.getByLabelText('Nome')).toBeInTheDocument();
    expect(screen.getByLabelText('Sobrenome')).toBeInTheDocument();
    expect(screen.getByLabelText(/CPF/)).toBeInTheDocument();
    expect(screen.getByLabelText('Data de nascimento')).toBeInTheDocument();
    expect(screen.getByLabelText('Sexo')).toBeInTheDocument();
  });

  it('should call mutateAsync with full payload including pessoaFisica on valid submit', async () => {
    mockMutateAsync.mockResolvedValue({});
    render(<CreateUserForm />);
    fillValidForm();

    fireEvent.click(screen.getByRole('button', { name: /criar usuário/i }));

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        name: 'Ana Souza',
        email: 'ana@test.com',
        password: 'Password123',
        role: 'VIEWER',
        pessoaFisica: {
          nome: 'Ana',
          sobrenome: 'Souza',
          cpf: '12345678901',
          dataNascimento: '1990-05-15',
          sexo: 'F',
        },
      });
    });
  });

  it('should show validation error when passwords do not match', async () => {
    render(<CreateUserForm />);
    fillValidForm({ confirmPassword: 'DifferentPass' });

    fireEvent.click(screen.getByRole('button', { name: /criar usuário/i }));

    await waitFor(() => {
      expect(screen.getByText('As senhas não coincidem')).toBeInTheDocument();
    });
    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  it('should show validation error when CPF has wrong format', async () => {
    render(<CreateUserForm />);
    fillValidForm({ cpf: '123' });

    fireEvent.click(screen.getByRole('button', { name: /criar usuário/i }));

    await waitFor(() => {
      expect(screen.getByText('CPF deve ter exatamente 11 dígitos numéricos')).toBeInTheDocument();
    });
    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  it('should show validation error when CPF contains letters', async () => {
    render(<CreateUserForm />);
    fillValidForm({ cpf: '1234567890a' });

    fireEvent.click(screen.getByRole('button', { name: /criar usuário/i }));

    await waitFor(() => {
      expect(screen.getByText('CPF deve ter exatamente 11 dígitos numéricos')).toBeInTheDocument();
    });
    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  it('should show validation error when nome has less than 2 characters', async () => {
    render(<CreateUserForm />);
    fillValidForm({ nome: 'A' });

    fireEvent.click(screen.getByRole('button', { name: /criar usuário/i }));

    await waitFor(() => {
      expect(screen.getByText('Nome deve ter ao menos 2 caracteres')).toBeInTheDocument();
    });
    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  it('should navigate to /admin/users after successful submission', async () => {
    mockMutateAsync.mockResolvedValue({});
    render(<CreateUserForm />);
    fillValidForm();

    fireEvent.click(screen.getByRole('button', { name: /criar usuário/i }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/admin/users');
    });
  });

  it('should render "Criando\u2026" label while isPending is true', () => {
    (useCreateUser as jest.Mock).mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: true,
    });
    render(<CreateUserForm />);

    expect(screen.getByRole('button', { name: /criando…/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /criando…/i })).toBeDisabled();
  });

  it('should not submit when required pessoa fisica fields are empty', async () => {
    render(<CreateUserForm />);

    // Only fill access fields, skip pessoa fisica
    fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'ana@test.com' } });
    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'Password123' } });
    fireEvent.change(screen.getByLabelText('Confirmar senha'), { target: { value: 'Password123' } });

    fireEvent.click(screen.getByRole('button', { name: /criar usuário/i }));

    await waitFor(() => {
      expect(mockMutateAsync).not.toHaveBeenCalled();
    });
  });
});
