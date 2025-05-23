'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterSuccess() {
  const router = useRouter();
  
  // Redirección automática después de 5 segundos
  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/login');
    }, 5000);
    
    return () => clearTimeout(timer);
  }, [router]);
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
            <svg className="h-6 w-6 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            ¡Registro Exitoso!
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Tu cuenta ha sido creada correctamente. Ahora puedes iniciar sesión para acceder a todos nuestros servicios.
          </p>
        </div>
        <div className="mt-5">
          <p className="text-sm text-gray-500">
            Serás redirigido a la página de inicio de sesión en 5 segundos...
          </p>
          <div className="mt-5">
            <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
              Iniciar sesión ahora →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
