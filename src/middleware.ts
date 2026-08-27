import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  
  const isAuthRoute = request.nextUrl.pathname.startsWith('/auth');
  const isProtectedRoute = request.nextUrl.pathname !== '/' && !isAuthRoute;

  // Si no hay token y es una ruta protegida (dashboard)
  if (!token && isProtectedRoute) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  // Si ya hay token y se intenta acceder a login/register
  if (token && isAuthRoute) {
    return NextResponse.redirect(new URL('/home', request.url));
  }

  // Redirigir la raiz '/' a '/home' (que luego redirigirá a login si no hay token por la regla 1)
  if (request.nextUrl.pathname === '/') {
    return NextResponse.redirect(new URL('/home', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
