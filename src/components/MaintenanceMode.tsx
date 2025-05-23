'use client';

import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { firestore } from '@/firebase/config';
import { auth } from '@/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function MaintenanceMode({ children }: { children: React.ReactNode }) {
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const pathname = usePathname();

  // Lista de rutas que siempre deben ser accesibles
  const allowedPaths = ['/login', '/forgot-password'];

  useEffect(() => {
    // Función para verificar el modo de mantenimiento
    const checkMaintenanceMode = async () => {
      try {
        const configDoc = await getDoc(doc(firestore, 'config', 'app'));
        if (configDoc.exists()) {
          const { maintenanceMode } = configDoc.data();
          setIsMaintenanceMode(!!maintenanceMode);
        }
      } catch (error) {
        console.error('Error fetching maintenance mode:', error);
        // En caso de error, asumimos que no está en mantenimiento
        setIsMaintenanceMode(false);
      }
    };

    // Verificar el modo de mantenimiento
    checkMaintenanceMode();

    // Suscribirse a cambios en la autenticación
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Obtener el documento del usuario desde Firestore
          const userDoc = await getDoc(doc(firestore, 'users', user.uid));
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            // Verificar si es administrador
            const userIsAdmin = userData.userType === 'admin';
            console.log('User role check:', { 
              email: user.email,
              userType: userData.userType,
              isAdmin: userIsAdmin
            });
            setIsAdmin(userIsAdmin);
          } else {
            setIsAdmin(false);
          }
        } catch (error) {
          console.error('Error fetching user role:', error);
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Mostrar una pantalla de carga mientras verificamos
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Verificación mejorada para permitir acceso a administradores y rutas permitidas
  if (!isMaintenanceMode || isAdmin || allowedPaths.includes(pathname)) {
    return <>{children}</>;
  }

  // Página de mantenimiento para usuarios no administradores
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <svg className="mx-auto h-16 w-16 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path>
          </svg>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Sitio en mantenimiento</h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Estamos realizando mejoras en nuestra plataforma. Por favor, vuelve más tarde.
          </p>
          <div className="mt-5">
            <Link 
              href="/login" 
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Iniciar sesión como administrador
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
