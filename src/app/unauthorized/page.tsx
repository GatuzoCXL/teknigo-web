'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function Unauthorized() {
  const { isAuthenticated, logOut } = useAuth();
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <svg 
            className="mx-auto h-20 w-20 text-red-600" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth="2" 
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            ></path>
          </svg>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Acceso No Autorizado
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            No tienes permisos para acceder a esta sección.
          </p>
        </div>
        
        <div className="flex flex-col space-y-4">
          <Link 
            href="/" 
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
          >
            Ir a la Página Principal
          </Link>
          
          {isAuthenticated && (
            <Link 
              href="/dashboard" 
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-600 hover:bg-gray-700 focus:outline-none"
            >
              Ir a mi Dashboard
            </Link>
          )}
          
          {isAuthenticated && (
            <button
              onClick={logOut}
              className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
            >
              Cerrar Sesión
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
