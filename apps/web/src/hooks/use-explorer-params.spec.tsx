import { renderHook } from '@testing-library/react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useExplorerParams } from './use-explorer-params';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
  useSearchParams: jest.fn(),
}));

const mockedUseRouter = useRouter as jest.Mock;
const mockedUsePathname = usePathname as jest.Mock;
const mockedUseSearchParams = useSearchParams as jest.Mock;

const push = jest.fn();
const replace = jest.fn();

function setup(search: string): void {
  mockedUseRouter.mockReturnValue({ push, replace });
  mockedUsePathname.mockReturnValue('/documents');
  mockedUseSearchParams.mockReturnValue(new URLSearchParams(search));
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('useExplorerParams — defaults and parsing', () => {
  it('defaults to the arquivos view, page 1 and empty filters when the URL is bare', () => {
    setup('');
    const { result } = renderHook(() => useExplorerParams());

    expect(result.current.params).toEqual({
      view: 'arquivos',
      q: '',
      arquivo: undefined,
      dossie: undefined,
      page: 1,
      depto: '',
      status: '',
      fase: '',
      conf: '',
      avulsos: 'documentos',
    });
    expect(result.current.mode).toBe('view');
  });

  it('falls back to arquivos for an unknown view value', () => {
    setup('view=bogus');
    const { result } = renderHook(() => useExplorerParams());
    expect(result.current.params.view).toBe('arquivos');
  });

  it('ignores a non-numeric or zero page and falls back to 1', () => {
    setup('page=0');
    const { result } = renderHook(() => useExplorerParams());
    expect(result.current.params.page).toBe(1);
  });

  it('reads q, depto, status, fase and conf verbatim', () => {
    setup('q=contrato&depto=dept-1&status=ABERTO&fase=CORRENTE&conf=RESTRITO');
    const { result } = renderHook(() => useExplorerParams());
    expect(result.current.params).toMatchObject({
      q: 'contrato',
      depto: 'dept-1',
      status: 'ABERTO',
      fase: 'CORRENTE',
      conf: 'RESTRITO',
    });
  });
});

describe('useExplorerParams — drill-down precedence', () => {
  it('resolves mode "view" when neither arquivo nor dossie is present', () => {
    setup('view=dossies');
    const { result } = renderHook(() => useExplorerParams());
    expect(result.current.mode).toBe('view');
  });

  it('resolves mode "arquivo-drill" when only arquivo is present', () => {
    setup('arquivo=arquivo-1');
    const { result } = renderHook(() => useExplorerParams());
    expect(result.current.mode).toBe('arquivo-drill');
  });

  it('resolves mode "dossie-drill" when dossie is present, even alongside arquivo', () => {
    setup('arquivo=arquivo-1&dossie=dossie-1');
    const { result } = renderHook(() => useExplorerParams());
    expect(result.current.mode).toBe('dossie-drill');
  });
});

describe('useExplorerParams — setParams', () => {
  it('replaces by default without adding a history entry', () => {
    setup('');
    const { result } = renderHook(() => useExplorerParams());

    result.current.setParams({ q: 'contrato' });

    expect(replace).toHaveBeenCalledWith('/documents?q=contrato', { scroll: false });
    expect(push).not.toHaveBeenCalled();
  });

  it('strips default values instead of writing them to the URL', () => {
    setup('q=old');
    const { result } = renderHook(() => useExplorerParams());

    result.current.setParams({ q: '', page: 1, view: 'arquivos', avulsos: 'documentos' });

    expect(replace).toHaveBeenCalledWith('/documents', { scroll: false });
  });

  it('pushes when explicitly asked to', () => {
    setup('');
    const { result } = renderHook(() => useExplorerParams());

    result.current.setParams({ depto: 'dept-1' }, { mode: 'push' });

    expect(push).toHaveBeenCalledWith('/documents?depto=dept-1');
    expect(replace).not.toHaveBeenCalled();
  });
});

describe('useExplorerParams — setTab', () => {
  it('clears drill-down and filters but preserves q and depto, and pushes', () => {
    setup('q=contrato&depto=dept-1&arquivo=a1&dossie=d1&page=3&status=ABERTO&fase=CORRENTE&conf=RESTRITO');
    const { result } = renderHook(() => useExplorerParams());

    result.current.setTab('dossies');

    expect(push).toHaveBeenCalledWith('/documents?q=contrato&depto=dept-1&view=dossies');
  });

  it('omits view=arquivos since it is the default', () => {
    setup('view=dossies&dossie=d1');
    const { result } = renderHook(() => useExplorerParams());

    result.current.setTab('arquivos');

    expect(push).toHaveBeenCalledWith('/documents');
  });
});

describe('useExplorerParams — drillArquivo / drillDossie / goToRoot', () => {
  it('drillArquivo sets arquivo, clears dossie and page, and pushes', () => {
    setup('dossie=old-dossie&page=2');
    const { result } = renderHook(() => useExplorerParams());

    result.current.drillArquivo('arquivo-1');

    expect(push).toHaveBeenCalledWith('/documents?arquivo=arquivo-1');
  });

  it('drillDossie sets both arquivo and dossie and pushes', () => {
    setup('');
    const { result } = renderHook(() => useExplorerParams());

    result.current.drillDossie('arquivo-1', 'dossie-1');

    expect(push).toHaveBeenCalledWith('/documents?arquivo=arquivo-1&dossie=dossie-1');
  });

  it('drillDossie without an arquivoId omits it (avulso dossiê)', () => {
    setup('');
    const { result } = renderHook(() => useExplorerParams());

    result.current.drillDossie(undefined, 'dossie-1');

    expect(push).toHaveBeenCalledWith('/documents?dossie=dossie-1');
  });

  it('goToRoot clears arquivo, dossie and page while keeping the current view', () => {
    setup('view=dossies&arquivo=a1&dossie=d1&page=3');
    const { result } = renderHook(() => useExplorerParams());

    result.current.goToRoot();

    expect(push).toHaveBeenCalledWith('/documents?view=dossies');
  });
});
