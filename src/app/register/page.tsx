'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PublicUserType } from '@/firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { firestore } from '@/firebase/config';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { registerSchema } from '@/utils/validationSchemas';
import { registerWithEmailAndPassword } from '@/firebase/auth';
import { validateEmail, validatePassword, getPasswordRequirements } from '@/utils/validation';

export default function Register() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Usar react-hook-form con validación yup
  const { register, handleSubmit, formState: { errors }, watch } = useForm({
    resolver: yupResolver(registerSchema),
    defaultValues: {
      displayName: '',
      email: '',
      password: '',
      confirmPassword: '',
      userType: 'client' as PublicUserType,
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
      
      // Validar que las contraseñas coincidan
      if (data.password !== data.confirmPassword) {
        setError('Las contraseñas no coinciden');
        setLoading(false);
        return;
      }

      // Validar email y contraseña
      const emailValidation = validateEmail(data.email);
      const passwordValidation = validatePassword(data.password);

      if (!emailValidation.isValid) {
        setError(emailValidation.message || 'Error en el correo electrónico');
        setLoading(false);
        return;
      }

      if (!passwordValidation.isValid) {
        setError(passwordValidation.message || 'Error en la contraseña');
        setLoading(false);
        return;
      }
      
      await registerWithEmailAndPassword(
        data.email,
        data.password,
        data.displayName,
        data.userType as PublicUserType
      );
      
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

  const passwordRequirements = getPasswordRequirements();

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
                  type="text"
                  className={`appearance-none block w-full px-3 py-2 border ${errors.displayName ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                  placeholder="Nombre completo"
                  {...register('displayName')}
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
                  type="email"
                  autoComplete="email"
                  className={`appearance-none block w-full px-3 py-2 border ${errors.email ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                  placeholder="pepe@gmail.com"
                  {...register('email')}
                />
                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
              </div>
            </div>
            
            {/* Contraseña */}
            <div className="relative">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Contraseña
              </label>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                className={`appearance-none block w-full pl-3 pr-10 py-2 border ${errors.password ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                placeholder="Contraseña"
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-500 mt-0"//posicion boton
              >
                {showPassword ? (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
              {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>}
              <p className="mt-1 text-xs text-gray-500">La contraseña debe tener al menos 8 caracteres</p>
            </div>
            
            {/* Confirmación de contraseña */}
            <div className="relative">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirmar contraseña
              </label>
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                autoComplete="new-password"
                className={`appearance-none block w-full pl-3 pr-10 py-2 border ${errors.confirmPassword ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                placeholder="Confirmar Contraseña"
                {...register('confirmPassword')}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-500 mt-5"//posicion boton
              >
                {showConfirmPassword ? (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
              {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>}
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

          <div className="bg-gray-50 p-4 rounded-md">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Requisitos de contraseña:</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              {passwordRequirements.map((requirement, index) => (
                <li key={index} className="flex items-start">
                  <svg
                    className={`h-5 w-5 mr-2 ${
                      watch('password') && validatePassword(watch('password')).isValid
                        ? 'text-green-500'
                        : 'text-gray-400'
                    }`}
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {requirement}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading || !!errors.email || !!errors.password || !!errors.confirmPassword}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
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
