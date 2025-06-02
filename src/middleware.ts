import { NextRequest, NextResponse } from 'next/server';

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
  
  // Rate limiting básico (en producción usar Redis o similar)
  const clientIP = req.ip || req.headers.get('x-forwarded-for') || 'unknown';
  const userAgent = req.headers.get('user-agent') || 'unknown';
  
  // Log de seguridad para rutas sensibles
  if (req.nextUrl.pathname.startsWith('/admin') || 
      req.nextUrl.pathname.startsWith('/api/')) {
    console.log(`Security Log: ${new Date().toISOString()} - ${clientIP} - ${userAgent} - ${req.nextUrl.pathname}`);
  }

  // Bloquear acceso directo a archivos de configuración
  if (req.nextUrl.pathname.includes('.env') || 
      req.nextUrl.pathname.includes('config.') ||
      req.nextUrl.pathname.includes('.git')) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  return response;
}

// Configurar middleware para correr en todas las rutas
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
