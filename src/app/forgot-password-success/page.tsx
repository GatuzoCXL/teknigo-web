'use client';

import Link from 'next/link';

export default function ForgotPasswordSuccess() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
        <div>
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
            <svg className="h-6 w-6 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Correo enviado
          </h2>
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              Hemos enviado un enlace a tu dirección de correo electrónico para restablecer tu contraseña.
            </p>
            <p className="mt-2 text-sm text-gray-600">
              Por favor, revisa tu bandeja de entrada (y la carpeta de spam, por si acaso) y sigue las instrucciones para crear una nueva contraseña.
            </p>
          </div>
        </div>
        
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            ¿No recibiste el correo?
          </p>
          <Link href="/forgot-password" className="mt-2 inline-block font-medium text-blue-600 hover:text-blue-500">
            Intentar de nuevo
          </Link>
        </div>
        
        <div className="border-t border-gray-200 pt-5 text-center">
          <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
            Volver a iniciar sesión
          </Link>
        </div>
      </div>
    </div>
  );
}
