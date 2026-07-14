import { render, screen, fireEvent } from '@testing-library/react';
import { CONFIDENCIALIDADE } from '@/types';
import { ConfidentialitySection, type ConfidentialitySectionValue } from './confidentiality-section';

jest.mock('next-auth/react', () => ({
  useSession: jest.fn().mockReturnValue({
    data: { user: { id: 'user-1', accessToken: 'test-token' } },
    status: 'authenticated',
  }),
}));

jest.mock('../../hooks/use-departments', () => ({
  useDepartments: jest.fn().mockReturnValue({
    data: [
      { id: 'dep-1', nome: 'Financeiro' },
      { id: 'dep-2', nome: 'Jurídico' },
    ],
  }),
}));

jest.mock('../../hooks/use-users', () => ({
  useUsers: jest.fn().mockReturnValue({
    data: [
      { id: 'user-1', name: 'Ana Souza', email: 'ana@test.com' },
      { id: 'user-2', name: 'Bruno Lima', email: 'bruno@test.com' },
    ],
  }),
}));

function baseValue(overrides?: Partial<ConfidentialitySectionValue>): ConfidentialitySectionValue {
  return {
    confidencialidade: CONFIDENCIALIDADE.RESTRITO,
    accessDepartamentoIds: [],
    accessUserIds: [],
    exigeCadastro: false,
    destaque: false,
    ...overrides,
  };
}

describe('ConfidentialitySection', () => {
  it('renders the level selector disabled and locked to Restrito, with no department/user picker, when canManage is false', () => {
    render(
      <ConfidentialitySection value={baseValue()} onChange={jest.fn()} canManage={false} />,
    );

    const levelTrigger = screen.getByRole('button', { name: 'Restrito' });
    expect(levelTrigger).toBeDisabled();
    expect(
      screen.getByText('Apenas administradores ou usuários com permissão podem definir outro nível.'),
    ).toBeInTheDocument();

    // Nenhum outro controle (picker de departamentos/usuários, toggle público) aparece.
    expect(screen.getAllByRole('button')).toHaveLength(1);
    expect(screen.queryByText('Departamentos adicionais com acesso')).not.toBeInTheDocument();
    expect(screen.queryByText('Usuários com acesso')).not.toBeInTheDocument();
  });

  it('renders the department MultiCombobox (not the user picker) when canManage is true and level is Restrito', () => {
    render(
      <ConfidentialitySection
        value={baseValue({ confidencialidade: CONFIDENCIALIDADE.RESTRITO })}
        onChange={jest.fn()}
        canManage
      />,
    );

    expect(screen.getByText('Departamentos adicionais com acesso')).toBeInTheDocument();
    expect(screen.getByText('O departamento do documento sempre tem acesso.')).toBeInTheDocument();
    expect(screen.queryByText('Usuários com acesso')).not.toBeInTheDocument();
  });

  it('renders the user MultiCombobox (not the department picker) and the accessUserIds error when canManage is true and level is Confidencial', () => {
    render(
      <ConfidentialitySection
        value={baseValue({ confidencialidade: CONFIDENCIALIDADE.CONFIDENCIAL, accessUserIds: ['user-1'] })}
        onChange={jest.fn()}
        canManage
        errors={{ accessUserIds: 'Selecione ao menos um usuário' }}
      />,
    );

    expect(screen.getByText('Usuários com acesso')).toBeInTheDocument();
    expect(screen.queryByText('Departamentos adicionais com acesso')).not.toBeInTheDocument();
    expect(screen.getByText('Selecione ao menos um usuário')).toBeInTheDocument();
    // Chip travado do usuário atual — sempre visível, não vem da MultiCombobox.
    expect(screen.getByText('Você (Ana Souza)')).toBeInTheDocument();
  });

  it('renders the livre/identificado toggle and an enabled destaque checkbox when canManage is true and level is Publico', () => {
    render(
      <ConfidentialitySection
        value={baseValue({ confidencialidade: CONFIDENCIALIDADE.PUBLICO })}
        onChange={jest.fn()}
        canManage
      />,
    );

    const livre = screen.getByRole('radio', { name: /Livre acesso/i });
    const identificado = screen.getByRole('radio', { name: /Acesso identificado/i });
    expect(livre).toBeInTheDocument();
    expect(identificado).toBeInTheDocument();
    expect(livre).not.toBeDisabled();
    expect(identificado).not.toBeDisabled();

    const destaque = screen.getByLabelText('Exibir no portal público como destaque');
    expect(destaque).toBeInTheDocument();
    expect(destaque).not.toBeDisabled();
  });

  it('clears accessDepartamentoIds/accessUserIds when the level changes', () => {
    const onChange = jest.fn();
    render(
      <ConfidentialitySection
        value={baseValue({
          confidencialidade: CONFIDENCIALIDADE.PUBLICO,
          destaque: true,
          exigeCadastro: true,
        })}
        onChange={onChange}
        canManage
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Público' }));
    fireEvent.click(screen.getByRole('option', { name: 'Restrito' }));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith({
      confidencialidade: CONFIDENCIALIDADE.RESTRITO,
      accessDepartamentoIds: [],
      accessUserIds: [],
      exigeCadastro: false,
      destaque: false,
    });
  });

  it('pre-fills accessUserIds with the current user when switching into Confidencial', () => {
    const onChange = jest.fn();
    render(
      <ConfidentialitySection
        value={baseValue({ confidencialidade: CONFIDENCIALIDADE.RESTRITO, accessDepartamentoIds: ['dep-1'] })}
        onChange={onChange}
        canManage
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Restrito' }));
    fireEvent.click(screen.getByRole('option', { name: 'Confidencial' }));

    expect(onChange).toHaveBeenCalledWith({
      confidencialidade: CONFIDENCIALIDADE.CONFIDENCIAL,
      accessDepartamentoIds: [],
      accessUserIds: ['user-1'],
      exigeCadastro: false,
      destaque: false,
    });
  });
});
