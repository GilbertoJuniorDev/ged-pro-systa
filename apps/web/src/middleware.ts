import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

const PUBLIC_ROUTES = ['/login'];

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

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
