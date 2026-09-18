import { act, render } from '@testing-library/react';
import type { Session } from 'next-auth';
import type { SessionContextValue } from 'next-auth/react';
import { getSession, useSession } from 'next-auth/react';
import { usePathname, useRouter } from 'next/navigation';
import { setUnauthorizedHandler } from '@/lib/api-client';
import { SESSION_ERROR, SESSION_EXPIRED_ROUTE } from '@/lib/session-expiry';
import { SessionExpiryProvider } from './session-expiry-provider';

jest.mock('next-auth/react', () => ({ useSession: jest.fn(), getSession: jest.fn() }));
jest.mock('next/navigation', () => ({ useRouter: jest.fn(), usePathname: jest.fn() }));
jest.mock('@/lib/api-client', () => ({ setUnauthorizedHandler: jest.fn() }));

const mockUseSession = jest.mocked(useSession);
const mockGetSession = jest.mocked(getSession);
const mockUseRouter = jest.mocked(useRouter);
const mockUsePathname = jest.mocked(usePathname);
const mockSetUnauthorizedHandler = jest.mocked(setUnauthorizedHandler);

/** Rota protegida qualquer — fora de toda a lista de EXEMPT_PREFIXES do provider. */
const PROTECTED_ROUTE = '/documentos';

const routerMock = {
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
  push: jest.fn(),
  replace: jest.fn(),
  prefetch: jest.fn(),
} satisfies ReturnType<typeof useRouter>;

const updateSession: SessionContextValue['update'] = async () => null;

const VALID_SESSION: Session = {
  expires: '2099-01-01T00:00:00.000Z',
  user: { id: 'user-1', name: 'Usuário', email: 'user@test.com' },
};

const EXPIRED_SESSION: Session = { ...VALID_SESSION, error: SESSION_ERROR.REFRESH_TOKEN };

function sessionContext(session: Session | null): SessionContextValue {
  return session === null
    ? { data: null, status: 'unauthenticated', update: updateSession }
    : { data: session, status: 'authenticated', update: updateSession };
}

function renderProvider(pathname: string, session: Session | null) {
  mockUsePathname.mockReturnValue(pathname);
  mockUseSession.mockReturnValue(sessionContext(session));

  return render(<SessionExpiryProvider />);
}

/** Primeiro argumento não-nulo registrado em `setUnauthorizedHandler` — o handler de 401. */
function registeredHandler(): () => void {
  for (const [handler] of mockSetUnauthorizedHandler.mock.calls) {
    if (handler !== null) return handler;
  }

  throw new Error('SessionExpiryProvider did not register an unauthorized handler');
}

describe('SessionExpiryProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue(routerMock);
    mockGetSession.mockResolvedValue(null);
  });

  it('should redirect to the session-expired route when the session carries a RefreshTokenError', () => {
    renderProvider(PROTECTED_ROUTE, EXPIRED_SESSION);

    expect(routerMock.replace).toHaveBeenCalledWith(SESSION_EXPIRED_ROUTE);
    expect(routerMock.replace).toHaveBeenCalledWith('/sessao-expirada');
  });

  it('should not redirect when the session has no error', () => {
    renderProvider(PROTECTED_ROUTE, VALID_SESSION);

    expect(routerMock.replace).not.toHaveBeenCalled();
  });

  it('should not redirect when the session is null', () => {
    renderProvider(PROTECTED_ROUTE, null);

    expect(routerMock.replace).not.toHaveBeenCalled();
  });

  it('should not redirect when the pathname is inside the public portal', () => {
    renderProvider('/portal/algum-doc', EXPIRED_SESSION);

    expect(routerMock.replace).not.toHaveBeenCalled();
  });

  it('should not redirect when it is already on the session-expired route', () => {
    renderProvider(SESSION_EXPIRED_ROUTE, EXPIRED_SESSION);

    expect(routerMock.replace).not.toHaveBeenCalled();
  });

  it('should register an unauthorized handler when it mounts on a protected route', () => {
    renderProvider(PROTECTED_ROUTE, VALID_SESSION);

    expect(mockSetUnauthorizedHandler).toHaveBeenCalledWith(expect.any(Function));
  });

  it('should not register an unauthorized handler when the route is exempt', () => {
    renderProvider('/login', VALID_SESSION);

    expect(mockSetUnauthorizedHandler).not.toHaveBeenCalled();
  });

  it('should call getSession once when the api client reports a 401', async () => {
    renderProvider(PROTECTED_ROUTE, VALID_SESSION);
    const handleUnauthorized = registeredHandler();

    await act(async () => {
      handleUnauthorized();
    });

    expect(mockGetSession).toHaveBeenCalledTimes(1);
  });

  it('should call getSession only once when two 401s arrive while a re-check is in flight', () => {
    mockGetSession.mockReturnValue(new Promise<Session | null>(() => undefined));
    renderProvider(PROTECTED_ROUTE, VALID_SESSION);
    const handleUnauthorized = registeredHandler();

    handleUnauthorized();
    handleUnauthorized();

    expect(mockGetSession).toHaveBeenCalledTimes(1);
  });

  it('should unregister the unauthorized handler when it unmounts', () => {
    const { unmount } = renderProvider(PROTECTED_ROUTE, VALID_SESSION);

    unmount();

    expect(mockSetUnauthorizedHandler).toHaveBeenLastCalledWith(null);
  });
});
