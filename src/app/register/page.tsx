'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { UserType } from '@/firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { firestore } from '@/firebase/config';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { registerSchema } from '@/utils/validationSchemas';

export default function Register() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Usar react-hook-form con validación yup
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(registerSchema),
    defaultValues: {
      displayName: '',
      email: '',
      password: '',
      confirmPassword: '',
      userType: 'client' as UserType,
      terms: false
    }
  });

  const onSubmit = async (data: any) => {
    setLoading(true);
    setError(null);
    
    try {
      // Verificar si los registros están permitidos
      const configDoc = await getDoc(doc(firestore, 'config', 'app'));
      if (configDoc.exists() && configDoc.data().allowRegistrations === false) {
        setError('Los registros de nuevos usuarios están temporalmente deshabilitados. Por favor, intente más tarde.');
        setLoading(false);
        return;
      }
      
      // Importar dinámicamente para evitar problemas en SSR
      const { registerWithEmailAndPassword, logout } = await import('@/firebase/auth');
      
      await registerWithEmailAndPassword(
        data.email, 
        data.password,
        data.displayName,
        data.userType
      );
      
      // Importante: cerrar sesión inmediatamente después del registro
      await logout();
      
      router.push('/register-success');
    } catch (error: any) {
      console.error('Error en registro:', error);
      
      // Manejar errores específicos de Firebase
      let errorMessage = 'Error al registrar usuario';
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'Este email ya está registrado';
          break;
        case 'auth/invalid-email':
          errorMessage = 'El formato de email es inválido';
          break;
        case 'auth/weak-password':
          errorMessage = 'La contraseña es demasiado débil';
          break;
        default:
          errorMessage = `Error: ${error.message || errorMessage}`;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
        <div>
          <h2 className="text-center text-3xl font-extrabold text-gray-900">
            Crea tu cuenta
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            O{' '}
            <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
              inicia sesión si ya tienes una cuenta
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
              </div>
            </div>
          </div>
        )}
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="rounded-md space-y-4">
            {/* Nombre completo */}
            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-gray-700">
                Nombre completo
              </label>
              <div className="mt-1">
                <input
                  id="displayName"
                  {...register('displayName')}
                  type="text"
                  className={`appearance-none block w-full px-3 py-2 border ${errors.displayName ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                  placeholder="Nombre completo"
                />
                {errors.displayName && <p className="mt-1 text-sm text-red-600">{errors.displayName.message}</p>}
              </div>
            </div>
            
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Correo electrónico
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  {...register('email')}
                  type="email"
                  autoComplete="email"
                  className={`appearance-none block w-full px-3 py-2 border ${errors.email ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                  placeholder="pepe@gmail.com"
                />
                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
              </div>
            </div>
            
            {/* Contraseña */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Contraseña
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  {...register('password')}
                  type="password"
                  autoComplete="new-password"
                  className={`appearance-none block w-full px-3 py-2 border ${errors.password ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                  placeholder="********"
                />
                {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>}
                <p className="mt-1 text-xs text-gray-500">La contraseña debe tener al menos 8 caracteres</p>
              </div>
            </div>
            
            {/* Confirmación de contraseña */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirmar contraseña
              </label>
              <div className="mt-1">
                <input
                  id="confirmPassword"
                  {...register('confirmPassword')}
                  type="password"
                  autoComplete="new-password"
                  className={`appearance-none block w-full px-3 py-2 border ${errors.confirmPassword ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                  placeholder="********"
                />
                {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>}
              </div>
            </div>
            
            {/* Tipo de usuario */}
            <div>
              <label htmlFor="userType" className="block text-sm font-medium text-gray-700">
                Tipo de cuenta
              </label>
              <div className="mt-1">
                <select
                  id="userType"
                  {...register('userType')}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="client">Cliente</option>
                  <option value="technician">Técnico</option>
                </select>
              </div>
            </div>
            
            {/* Términos y condiciones */}
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="terms"
                  {...register('terms')}
                  type="checkbox"
                  className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="terms" className="font-medium text-gray-700">
                  Acepto los <Link href="/terms" className="text-blue-600 hover:text-blue-500">términos y condiciones</Link>
                </label>
                {errors.terms && <p className="mt-1 text-sm text-red-600">{errors.terms.message}</p>}
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </span>
                  Procesando...
                </>
              ) : (
                'Registrarse'
              )}
            </button>
          </div>
        </form>
        
        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">O regístrate con</span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <button
              type="button"
              disabled={loading}
              onClick={async () => {
                setLoading(true);
                setError(null);
                try {
                  const { signInWithGoogle } = await import('@/firebase/auth');
                  await signInWithGoogle();
                  router.push('/dashboard');
                } catch (error: any) {
                  console.error('Error con Google:', error);
                  
                  // Manejar errores específicos de Google
                  let errorMessage = 'Error al registrarse con Google';
                  
                  if (error.code) {
                    switch (error.code) {
                      case 'auth/popup-closed-by-user':
                        // No mostrar error si el usuario simplemente cerró el popup
                        console.log('Usuario canceló el login con Google');
                        return; // Salir sin mostrar error
                      case 'auth/popup-blocked':
                        errorMessage = 'El popup fue bloqueado por tu navegador. Por favor, permite popups para este sitio.';
                        break;
                      case 'auth/cancelled-popup-request':
                        errorMessage = 'Proceso de autenticación cancelado. Inténtalo de nuevo.';
                        break;
                      case 'auth/account-exists-with-different-credential':
                        errorMessage = 'Ya existe una cuenta con este email usando un método diferente.';
                        break;
                      case 'auth/network-request-failed':
                        errorMessage = 'Error de conexión. Verifica tu internet e inténtalo de nuevo.';
                        break;
                      default:
                        errorMessage = `Error: ${error.message || errorMessage}`;
                    }
                  }
                  
                  setError(errorMessage);
                } finally {
                  setLoading(false);
                }
              }}
              className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                  <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.28426 53.749 C -8.52426 55.229 -9.21677 56.479 -10.0802 57.329 L -10.0802 60.609 L -6.27596 60.609 C -4.20446 58.704 -3.264 55.924 -3.264 51.509 Z"/>
                  <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.80446 62.159 -6.81596 60.609 L -10.0902 57.329 C -11.1252 58.264 -12.545 58.819 -14.754 58.819 C -17.514 58.819 -19.8945 57.139 -20.8645 54.639 L -24.7893 54.639 L -24.7893 58.059 C -22.7998 61.539 -19.054 63.239 -14.754 63.239 Z"/>
                  <path fill="#FBBC05" d="M -20.8645 54.639 C -21.2395 53.539 -21.454 52.359 -21.454 51.139 C -21.454 49.919 -21.229 48.739 -20.8645 47.639 L -20.8645 44.219 L -24.7893 44.219 C -26.0293 46.709 -26.654 49.539 -26.654 52.329 C -26.654 55.119 -25.9898 57.659 -24.7893 60.149 L -20.8645 54.639 Z"/>
                  <path fill="#EA4335" d="M -14.754 43.419 C -12.5645 43.419 -10.6345 44.099 -8.98596 45.419 L -6.93596 43.419 C -9.23596 41.249 -12.275 39.979 -15.004 39.979 C -19.304 39.979 -23.054 41.669 -25.044 45.069 L -20.8645 47.649 C -19.8745 45.149 -17.544 43.419 -14.754 43.419 Z"/>
                </g>
              </svg>
              Google
            </button>
            
            <button
              type="button"
              disabled={loading}
              onClick={async () => {
                setLoading(true);
                setError(null);
                try {
                  const { signInWithFacebook } = await import('@/firebase/auth');
                  await signInWithFacebook();
                  router.push('/dashboard');
                } catch (error: any) {
                  console.error('Error con Facebook:', error);
                  
                  // Manejar errores específicos de Facebook
                  let errorMessage = 'Error al registrarse con Facebook';
                  
                  if (error.code) {
                    switch (error.code) {
                      case 'auth/popup-closed-by-user':
                        // No mostrar error si el usuario simplemente cerró el popup
                        console.log('Usuario canceló el login con Facebook');
                        return; // Salir sin mostrar error
                      case 'auth/popup-blocked':
                        errorMessage = 'El popup fue bloqueado por tu navegador. Por favor, permite popups para este sitio.';
                        break;
                      case 'auth/cancelled-popup-request':
                        errorMessage = 'Proceso de autenticación cancelado. Inténtalo de nuevo.';
                        break;
                      case 'auth/account-exists-with-different-credential':
                        errorMessage = 'Ya existe una cuenta con este email usando un método diferente.';
                        break;
                      default:
                        errorMessage = `Error: ${error.message || errorMessage}`;
                    }
                  }
                  
                  setError(errorMessage);
                } finally {
                  setLoading(false);
                }
              }}
              className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5 mr-2" fill="#1877F2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z" />
              </svg>
              Facebook
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
