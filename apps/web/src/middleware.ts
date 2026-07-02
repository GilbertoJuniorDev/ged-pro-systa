import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

const PUBLIC_ROUTES = ['/login', '/reset-password'];
const ADMIN_ROUTES_PREFIX = '/admin';

/**
 * Mapeamento de prefixo de rota → slug do módulo exigido.
 * Basta ter qualquer permissão vinculada ao módulo para o acesso ser liberado.
 * ADMIN sempre bypassa essa checagem.
 */
const MODULE_ROUTES: ReadonlyArray<readonly [string, string]> = [
  ['/documents', 'documentos'],
  ['/categories', 'categorias'],
];

export default auth((req) => {
  const { nextUrl, auth: session } = req;
  const isPublicRoute = PUBLIC_ROUTES.includes(nextUrl.pathname);
  const isProtectedRoute = !isPublicRoute;

  if (!session && isProtectedRoute) {
    return NextResponse.redirect(new URL('/login', nextUrl));
  }

  if (session && isPublicRoute) {
    return NextResponse.redirect(new URL('/', nextUrl));
  }

  if (session && nextUrl.pathname.startsWith(ADMIN_ROUTES_PREFIX)) {
    const role = (session.user as { role?: string } | undefined)?.role;
    if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
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
