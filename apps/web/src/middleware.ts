import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

const PUBLIC_ROUTES = ['/login', '/reset-password'];
// Portal público de documentos: liberado por prefixo (não por match exato como
// PUBLIC_ROUTES), e tratado à parte porque, ao contrário de /login e /reset-password,
// usuários já logados NÃO devem ser redirecionados para fora dele.
const PORTAL_ROUTE_PREFIX = '/portal';
const ADMIN_ROUTES_PREFIX = '/admin';
const SUPER_ADMIN_ROUTES_PREFIX = [
  '/admin/modulos',
  '/admin/permissoes',
  '/admin/audit-logs',
  '/admin/assinatura',
  '/admin/logs',
];

/**
 * Mapeamento de prefixo de rota → slug do módulo exigido.
 * Basta ter qualquer permissão vinculada ao módulo para o acesso ser liberado.
 * ADMIN sempre bypassa essa checagem.
 */
const MODULE_ROUTES: ReadonlyArray<readonly [string, string]> = [
  ['/documents', 'documentos'],
];

export default auth((req) => {
  const { nextUrl, auth: session } = req;
  const isPublicRoute = PUBLIC_ROUTES.includes(nextUrl.pathname);
  const isPortalRoute =
    nextUrl.pathname === PORTAL_ROUTE_PREFIX || nextUrl.pathname.startsWith(`${PORTAL_ROUTE_PREFIX}/`);
  const isProtectedRoute = !isPublicRoute && !isPortalRoute;

  if (!session && isProtectedRoute) {
    return NextResponse.redirect(new URL('/login', nextUrl));
  }

  if (session && isPublicRoute) {
    return NextResponse.redirect(new URL('/', nextUrl));
  }

  // Rota pública própria: liberada para visitantes anônimos E para usuários já logados
  // (sem bounce para `/`), e isenta do gating de admin/super-admin/módulo abaixo.
  if (isPortalRoute) {
    return NextResponse.next();
  }

  if (session && nextUrl.pathname.startsWith(ADMIN_ROUTES_PREFIX)) {
    const role = (session.user as { role?: string } | undefined)?.role;
    if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
      return NextResponse.redirect(new URL('/', nextUrl));
    }
  }

  if (session && SUPER_ADMIN_ROUTES_PREFIX.some((prefix) => nextUrl.pathname === prefix || nextUrl.pathname.startsWith(prefix + '/'))) {
    const role = (session.user as { role?: string } | undefined)?.role;
    if (role !== 'SUPER_ADMIN') {
      return NextResponse.redirect(new URL('/', nextUrl));
    }
  }

  if (session) {
    const role = (session.user as { role?: string } | undefined)?.role;
    const modulos = (session.user as { modulos?: string[] } | undefined)?.modulos ?? [];

    const requiredModulo = MODULE_ROUTES.find(([prefix]) =>
      nextUrl.pathname === prefix || nextUrl.pathname.startsWith(prefix + '/'),
    )?.[1];

    if (
      requiredModulo &&
      role !== 'ADMIN' &&
      role !== 'SUPER_ADMIN' &&
      !modulos.includes(requiredModulo)
    ) {
      return NextResponse.redirect(new URL('/', nextUrl));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
