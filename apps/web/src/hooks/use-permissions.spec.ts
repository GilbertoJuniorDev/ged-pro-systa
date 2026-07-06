import { renderHook } from '@testing-library/react';
import { useSession } from 'next-auth/react';
import { usePermissions } from './use-permissions';

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
}));

const mockedUseSession = useSession as jest.Mock;

describe('usePermissions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return empty permissoes when session is null', () => {
    mockedUseSession.mockReturnValue({ data: null, status: 'unauthenticated' });

    const { result } = renderHook(() => usePermissions());

    expect(result.current.permissoes).toEqual([]);
    expect(result.current.hasPermission('DOCUMENTO_VISUALIZAR')).toBe(false);
  });

  it('should return empty modulos when session is null', () => {
    mockedUseSession.mockReturnValue({ data: null, status: 'unauthenticated' });

    const { result } = renderHook(() => usePermissions());

    expect(result.current.modulos).toEqual([]);
    expect(result.current.hasModuleAccess('documentos')).toBe(false);
  });

  it('should return false for hasPermission when user has no matching permission', () => {
    mockedUseSession.mockReturnValue({
      data: {
        user: { role: 'VIEWER', permissoes: ['DOCUMENTO_VISUALIZAR'], modulos: ['documentos'] },
      },
      status: 'authenticated',
    });

    const { result } = renderHook(() => usePermissions());

    expect(result.current.hasPermission('DOCUMENTO_EXCLUIR')).toBe(false);
    expect(result.current.hasPermission('DOCUMENTO_VISUALIZAR')).toBe(true);
  });

  it('should return true for hasPermission when permission is present', () => {
    mockedUseSession.mockReturnValue({
      data: {
        user: { role: 'MANAGER', permissoes: ['RELATORIO_GERAR', 'DOCUMENTO_EDITAR'], modulos: [] },
      },
      status: 'authenticated',
    });

    const { result } = renderHook(() => usePermissions());

    expect(result.current.hasPermission('RELATORIO_GERAR')).toBe(true);
    expect(result.current.hasPermission('DOCUMENTO_EDITAR')).toBe(true);
    expect(result.current.hasPermission('DOCUMENTO_EXCLUIR')).toBe(false);
  });

  it('should return true for any permission when role is ADMIN (bypass)', () => {
    mockedUseSession.mockReturnValue({
      data: {
        user: { role: 'ADMIN', permissoes: [], modulos: [] },
      },
      status: 'authenticated',
    });

    const { result } = renderHook(() => usePermissions());

    expect(result.current.hasPermission('DOCUMENTO_EXCLUIR')).toBe(true);
    expect(result.current.hasPermission('QUALQUER_PERMISSAO')).toBe(true);
  });

  it('should return true for hasModuleAccess when module slug is present', () => {
    mockedUseSession.mockReturnValue({
      data: {
        user: { role: 'VIEWER', permissoes: [], modulos: ['documentos', 'categorias'] },
      },
      status: 'authenticated',
    });

    const { result } = renderHook(() => usePermissions());

    expect(result.current.hasModuleAccess('documentos')).toBe(true);
    expect(result.current.hasModuleAccess('categorias')).toBe(true);
    expect(result.current.hasModuleAccess('usuarios')).toBe(false);
  });

  it('should return true for hasModuleAccess when role is ADMIN (bypass)', () => {
    mockedUseSession.mockReturnValue({
      data: {
        user: { role: 'ADMIN', permissoes: [], modulos: [] },
      },
      status: 'authenticated',
    });

    const { result } = renderHook(() => usePermissions());

    expect(result.current.hasModuleAccess('documentos')).toBe(true);
    expect(result.current.hasModuleAccess('qualquer-modulo')).toBe(true);
  });

  it('should return true for hasPermission and hasModuleAccess when role is SUPER_ADMIN (bypass)', () => {
    mockedUseSession.mockReturnValue({
      data: {
        user: { role: 'SUPER_ADMIN', permissoes: [], modulos: [] },
      },
      status: 'authenticated',
    });

    const { result } = renderHook(() => usePermissions());

    expect(result.current.hasPermission('QUALQUER_PERMISSAO')).toBe(true);
    expect(result.current.hasModuleAccess('qualquer-modulo')).toBe(true);
  });

  it('should expose permissoes and modulos arrays from session', () => {
    const permissoes = ['DOCUMENTO_VISUALIZAR', 'CATEGORIA_CRIAR'];
    const modulos = ['documentos', 'categorias'];
    mockedUseSession.mockReturnValue({
      data: { user: { role: 'VIEWER', permissoes, modulos } },
      status: 'authenticated',
    });

    const { result } = renderHook(() => usePermissions());

    expect(result.current.permissoes).toEqual(permissoes);
    expect(result.current.modulos).toEqual(modulos);
  });
});
