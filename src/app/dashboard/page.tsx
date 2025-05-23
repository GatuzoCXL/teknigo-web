'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, firestore } from '@/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Link from 'next/link';
import Image from 'next/image';

// Componentes específicos para cada tipo de usuario
import ClientDashboard from '@/components/dashboard/ClientDashboard';
import TechnicianDashboard from '@/components/dashboard/TechnicianDashboard';

export default function Dashboard() {
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(firestore, 'users', user.uid));
          if (userDoc.exists()) {
            setUserData({
              ...userDoc.data(),
              email: user.email,
              uid: user.uid,
              photoURL: user.photoURL,
              displayName: user.displayName || userDoc.data().displayName
            });
          }
        } catch (error) {
          console.error('Error al obtener datos del usuario:', error);
        } finally {
          setLoading(false);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      router.push('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-100">
        {/* Header/Navbar */}
        <nav className="bg-white shadow-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex">
                <div className="flex-shrink-0 flex items-center">
                  <Link href="/" className="font-bold text-2xl text-blue-600">
                    Teknigo
                  </Link>
                </div>
              </div>
              
              <div className="flex items-center">
                {userData && (
                  <div className="ml-3 relative">
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">
                          {userData.displayName}
                        </div>
                        <div className="text-xs text-gray-500 capitalize">
                          {userData.userType}
                        </div>
                      </div>
                      <div className="flex-shrink-0 h-10 w-10 relative">
                        {userData.photoURL ? (
                          <Image 
                            src={userData.photoURL} 
                            alt="Profile"
                            width={40}
                            height={40}
                            className="rounded-full"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium uppercase">
                            {userData.displayName?.charAt(0) || userData.email?.charAt(0) || 'U'}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={handleLogout}
                        className="ml-2 px-3 py-1 border border-red-500 text-red-500 rounded-md hover:bg-red-500 hover:text-white transition-colors text-sm"
                      >
                        Salir
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </nav>

        {/* Contenido principal */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : userData ? (
          <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            {/* Información de usuario */}
            <div className="px-4 py-6 sm:px-0">
              <div className="border-b border-gray-200 pb-5 mb-5">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Panel de {userData.userType === 'client' ? 'Cliente' : userData.userType === 'technician' ? 'Técnico' : 'Administrador'}
                </h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                  Bienvenido/a {userData.displayName || userData.email}
                </p>
              </div>
              
              {/* Dashboard específico según el tipo de usuario */}
              {userData.userType === 'client' && (
                <ClientDashboard userId={userData.uid} />
              )}
              
              {userData.userType === 'technician' && (
                <TechnicianDashboard userId={userData.uid} />
              )}
              
              {userData.userType === 'admin' && (
                <div className="bg-white shadow rounded-lg p-6 mb-6">
                  <h2 className="text-xl font-medium mb-4">Administración</h2>
                  <div className="flex space-x-4">
                    <Link 
                      href="/admin" 
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Ir al Panel de Administración
                    </Link>
                  </div>
                </div>
              )}
              
              {/* Información del perfil */}
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-xl font-medium mb-4">Mi Perfil</h2>
                <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Nombre</dt>
                    <dd className="mt-1 text-sm text-gray-900">{userData.displayName || 'No especificado'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Email</dt>
                    <dd className="mt-1 text-sm text-gray-900">{userData.email}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Tipo de Cuenta</dt>
                    <dd className="mt-1 text-sm text-gray-900 capitalize">{userData.userType}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Cuenta creada</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {userData.createdAt ? new Date(userData.createdAt.toDate()).toLocaleDateString() : 'No disponible'}
                    </dd>
                  </div>
                </dl>
                <div className="mt-6">
                  <Link 
                    href="/profile/edit" 
                    className="inline-flex items-center px-4 py-2 border border-blue-500 text-blue-500 rounded-md hover:bg-blue-500 hover:text-white transition-colors"
                  >
                    Editar Perfil
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <p>No se pudo cargar la información del usuario</p>
            <button
              onClick={handleLogout}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Volver a iniciar sesión
            </button>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
