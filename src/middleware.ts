import { NextResponse, NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  // Clonar los headers para modificarlos
  const response = NextResponse.next();

  // Agregar encabezados de seguridad adicionales
  const headers = response.headers;

  // Prevenir XSS y otros ataques comunes
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-XSS-Protection', '1; mode=block');
  headers.set('X-Frame-Options', 'DENY');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  // TEMPORALMENTE DESACTIVAMOS LA CSP ESTRICTA HASTA SOLUCIONAR EL PROBLEMA DE GOOGLE AUTH
  // headers.set(
  //   'Content-Security-Policy',
  //   "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' *.googleapis.com *.firebaseio.com *.firebaseapp.com; connect-src 'self' *.googleapis.com *.firebaseio.com *.firebaseapp.com; img-src 'self' data: blob: *.googleapis.com *.gstatic.com; style-src 'self' 'unsafe-inline' *.googleapis.com; font-src 'self' data: *.gstatic.com; frame-src 'self' *.firebaseapp.com;"
  // );

  return response;
}

// Configurar middleware para correr en todas las rutas
export const config = {
  matcher: ['/((?!api|_next/static|favicon.ico).*)'],
};
