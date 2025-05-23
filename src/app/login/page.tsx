'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { loginWithEmailAndPassword, LoginSecurityError } from '@/firebase/auth';
import { sendPasswordReset, formatBlockTime } from '@/firebase/loginSecurity';
import EmergencyMaintenanceToggle from '@/components/EmergencyMaintenanceToggle';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockTimeRemaining, setBlockTimeRemaining] = useState(0);
  const [suggestReset, setSuggestReset] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkRedirectResult = async () => {
      try {
        const { getGoogleRedirectResult } = await import('@/firebase/auth');
        const user = await getGoogleRedirectResult();
        if (user) {
          router.push('/dashboard');
        }
      } catch (err) {
        console.error('Error al procesar redirección:', err);
        setError('Error al procesar el inicio de sesión con Google');
      } finally {
        setLoading(false);
      }
    };
    
    checkRedirectResult();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setIsBlocked(false);
    setSuggestReset(false);
    
    try {
      // Podríamos obtener el IP real del usuario con un endpoint en el backend
      // Por ahora usamos un ID aleatorio para simular
      const simulatedClientIP = window.navigator.userAgent + new Date().getTime();
      
      await loginWithEmailAndPassword(email, password, simulatedClientIP);
      router.push('/dashboard');
    } catch (err: any) {
      console.error('Error de autenticación:', err);
      
      // Manejar errores de seguridad
      if (err instanceof LoginSecurityError) {
        setIsBlocked(true);
        setBlockTimeRemaining(err.blockTimeRemaining);
        setSuggestReset(err.suggestPasswordReset);
        setError(err.message);
      } else {
        // Manejar códigos de error de Firebase
        let errorMessage = 'Error al iniciar sesión';
        
        if (err.code) {
          switch (err.code) {
            case 'auth/invalid-credential':
              errorMessage = 'Credenciales inválidas. Verifica tu email y contraseña.';
              break;
            case 'auth/user-disabled':
              errorMessage = 'Esta cuenta ha sido deshabilitada.';
              break;
            case 'auth/user-not-found':
              errorMessage = 'No existe una cuenta con este email.';
              break;
            case 'auth/wrong-password':
              errorMessage = 'Contraseña incorrecta.';
              break;
            case 'auth/too-many-requests':
              errorMessage = 'Demasiados intentos fallidos. Intenta más tarde o restablece tu contraseña.';
              break;
          }
        }
        
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Importar la función de manera dinámica
      const authModule = await import('@/firebase/auth');
      
      // Verificar que la función exista antes de llamarla
      if (typeof authModule.signInWithGoogle !== 'function') {
        throw new Error('La función signInWithGoogle no está disponible');
      }
      
      // Llamar a la función de autenticación
      const user = await authModule.signInWithGoogle();
      
      if (user) {
        console.log('Inicio de sesión con Google exitoso:', user.displayName);
        router.push('/dashboard');
      } else {
        throw new Error('No se pudo obtener información del usuario');
      }
    } catch (err) {
      console.error('Error completo al iniciar sesión con Google:', err);
      
      // Mensaje de error más detallado para facilitar la depuración
      setError(`Error al iniciar sesión con Google: ${err.message || 'Error desconocido'}`);
    } finally {
      setLoading(false);
    }
  };
  
  const handlePasswordReset = async () => {
    if (!email.trim()) {
      setError('Ingresa tu dirección de correo electrónico para restablecer tu contraseña.');
      return;
    }
    
    setLoading(true);
    const { resetPassword } = await import('@/firebase/auth');
    const success = await resetPassword(email);
    setLoading(false);
    
    if (success) {
      alert('Se ha enviado un enlace para restablecer tu contraseña a tu correo electrónico.');
    } else {
      setError('No se pudo enviar el enlace de restablecimiento. Inténtalo de nuevo más tarde.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Iniciar sesión
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            O{' '}
            <Link href="/register" className="font-medium text-blue-600 hover:text-blue-500">
              crea una cuenta nueva
            </Link>
          </p>
        </div>
        
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
                
                {/* Mostrar opción de reset si se sugiere */}
                {suggestReset && (
                  <button
                    onClick={handlePasswordReset}
                    className="mt-2 text-sm font-medium text-red-700 hover:text-red-600"
                  >
                    ¿Olvidaste tu contraseña? Haz clic para restablecerla
                  </button>
                )}
                
                {/* Mostrar tiempo restante si está bloqueado */}
                {isBlocked && blockTimeRemaining > 0 && (
                  <p className="mt-1 text-sm text-red-700">
                    Por favor intenta de nuevo en {formatBlockTime(blockTimeRemaining)}.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <input type="hidden" name="remember" defaultValue="true" />
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email-address" className="sr-only">
                Correo electrónico
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Correo electrónico"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Contraseña
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                Recordarme
              </label>
            </div>

            <div className="text-sm">
              <Link href="/forgot-password" className="font-medium text-blue-600 hover:text-blue-500">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading || (isBlocked && blockTimeRemaining > 0)}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? (
                <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </span>
              ) : (
                <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                  <svg className="h-5 w-5 text-blue-500 group-hover:text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                </span>
              )}
              {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
            </button>
          </div>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gray-50 text-gray-500">O continúa con</span>
              </div>
            </div>

            <div className="mt-6">
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" width="24" height="24">
                  <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                    <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"/>
                    <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"/>
                    <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"/>
                    <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"/>
                  </g>
                </svg>
                Iniciar sesión con Google
              </button>
            </div>
          </div>
        </form>
        
        {/* Añadir el componente de emergencia */}
        <EmergencyMaintenanceToggle />
      </div>
    </div>
  );
}
