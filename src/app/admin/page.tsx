'use client';

import { useState, useEffect } from 'react';
import { firestore } from '@/firebase/config';
import { collection, getDocs, query, where } from 'firebase/firestore';
import AdminLayout from '@/components/admin/AdminLayout';
import Link from 'next/link';

interface StatCard {
  title: string;
  value: number;
  icon: string;
  color: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTechnicians: 0,
    pendingServices: 0,
    activeServices: 0,
    completedServices: 0
  });
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [recentServices, setRecentServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch user statistics
        const usersSnapshot = await getDocs(collection(firestore, 'users'));
        const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        const technicians = users.filter(user => user.userType === 'technician');
        
        // Fetch service statistics
        const servicesSnapshot = await getDocs(collection(firestore, 'services'));
        const services = servicesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        const pendingServices = services.filter(service => 
          service.status === 'pending' || service.status === 'accepted');
        const activeServices = services.filter(service => service.status === 'in_progress');
        const completedServices = services.filter(service => service.status === 'completed');
        
        // Update statistics
        setStats({
          totalUsers: users.length,
          totalTechnicians: technicians.length,
          pendingServices: pendingServices.length,
          activeServices: activeServices.length,
          completedServices: completedServices.length
        });
        
        // Get recent users
        const recentUsers = [...users]
          .sort((a: any, b: any) => {
            return b.createdAt?.toDate() - a.createdAt?.toDate() || 0;
          })
          .slice(0, 5);
        
        setRecentUsers(recentUsers);
        
        // Get recent services
        const recentServices = [...services]
          .sort((a: any, b: any) => {
            return b.createdAt?.toDate() - a.createdAt?.toDate() || 0;
          })
          .slice(0, 5);
        
        setRecentServices(recentServices);
        
      } catch (err) {
        console.error('Error fetching admin data:', err);
        setError('Error al cargar los datos. Por favor, inténtalo de nuevo más tarde.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const statCards: StatCard[] = [
    {
      title: 'Usuarios Totales',
      value: stats.totalUsers,
      icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
      color: 'bg-blue-500'
    },
    {
      title: 'Técnicos',
      value: stats.totalTechnicians,
      icon: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
      color: 'bg-purple-500'
    },
    {
      title: 'Servicios Pendientes',
      value: stats.pendingServices,
      icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
      color: 'bg-yellow-500'
    },
    {
      title: 'Servicios Activos',
      value: stats.activeServices,
      icon: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z',
      color: 'bg-indigo-500'
    },
    {
      title: 'Servicios Completados',
      value: stats.completedServices,
      icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
      color: 'bg-green-500'
    }
  ];

  const getStatusBadgeClass = (status: string) => {
    switch(status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'accepted': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-purple-100 text-purple-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch(status) {
      case 'pending': return 'Pendiente';
      case 'accepted': return 'Aceptado';
      case 'in_progress': return 'En Progreso';
      case 'completed': return 'Completado';
      case 'cancelled': return 'Cancelado';
      default: return 'Desconocido';
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold text-gray-900">Panel de Administración</h1>
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="mt-6 bg-red-50 border-l-4 border-red-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-2 text-sm font-medium text-red-700 hover:text-red-600"
                >
                  Reintentar
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Stats cards */}
            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {statCards.map((stat) => (
                <div key={stat.title} className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className={`flex-shrink-0 ${stat.color} rounded-md p-3`}>
                        <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={stat.icon} />
                        </svg>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          {stat.title}
                        </dt>
                        <dd className="flex items-baseline">
                          <div className="text-2xl font-semibold text-gray-900">
                            {stat.value}
                          </div>
                        </dd>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick access section */}
            <div className="mt-8">
              <h2 className="text-lg font-medium text-gray-900">Acceso rápido</h2>
              <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                <Link href="/admin/users" className="bg-white overflow-hidden shadow rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                      <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-medium text-gray-900">Gestionar Usuarios</h3>
                    </div>
                  </div>
                </Link>
                
                <Link href="/admin/technicians" className="bg-white overflow-hidden shadow rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-purple-100 rounded-md p-3">
                      <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-medium text-gray-900">Gestionar Técnicos</h3>
                    </div>
                  </div>
                </Link>
                
                <Link href="/admin/services" className="bg-white overflow-hidden shadow rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-yellow-100 rounded-md p-3">
                      <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-medium text-gray-900">Gestionar Servicios</h3>
                    </div>
                  </div>
                </Link>
                
                <Link href="/admin/settings" className="bg-white overflow-hidden shadow rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-gray-100 rounded-md p-3">
                      <svg className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-medium text-gray-900">Configuración</h3>
                    </div>
                  </div>
                </Link>
              </div>
            </div>

            {/* Recent activity */}
            <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Recent users */}
              <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Usuarios recientes</h3>
                    <p className="text-sm text-gray-500">Últimos usuarios registrados</p>
                  </div>
                  <Link href="/admin/users" className="text-sm text-blue-600 hover:text-blue-500">
                    Ver todos
                  </Link>
                </div>
                <div className="border-t border-gray-200">
                  <ul role="list" className="divide-y divide-gray-200">
                    {recentUsers.length > 0 ? (
                      recentUsers.map((user) => (
                        <li key={user.id} className="px-4 py-4 sm:px-6">
                          <div className="flex items-center justify-between">
                            <div className="text-sm font-medium text-blue-600 truncate">
                              {user.displayName || 'Usuario sin nombre'}
                            </div>
                            <div className="ml-2 flex-shrink-0 flex">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full capitalize ${
                                user.userType === 'admin' ? 'bg-purple-100 text-purple-800' :
                                user.userType === 'technician' ? 'bg-green-100 text-green-800' :
                                'bg-blue-100 text-blue-800'
                              }`}>
                                {user.userType || 'cliente'}
                              </span>
                            </div>
                          </div>
                          <div className="mt-2 sm:flex sm:justify-between">
                            <div className="sm:flex">
                              <p className="text-sm text-gray-500">
                                {user.email}
                              </p>
                            </div>
                            <div className="mt-2 text-sm text-gray-500 sm:mt-0">
                              <p>
                                {user.createdAt ? new Date(user.createdAt.toDate()).toLocaleDateString() : 'Fecha desconocida'}
                              </p>
                            </div>
                          </div>
                        </li>
                      ))
                    ) : (
                      <li className="px-4 py-4 sm:px-6 text-sm text-gray-500 text-center">
                        No hay usuarios registrados
                      </li>
                    )}
                  </ul>
                </div>
              </div>

              {/* Recent services */}
              <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Servicios recientes</h3>
                    <p className="text-sm text-gray-500">Últimos servicios solicitados</p>
                  </div>
                  <Link href="/admin/services" className="text-sm text-blue-600 hover:text-blue-500">
                    Ver todos
                  </Link>
                </div>
                <div className="border-t border-gray-200">
                  <ul role="list" className="divide-y divide-gray-200">
                    {recentServices.length > 0 ? (
                      recentServices.map((service) => (
                        <li key={service.id} className="px-4 py-4 sm:px-6">
                          <div className="flex items-center justify-between">
                            <div className="text-sm font-medium text-gray-900 truncate">
                              {service.serviceType || 'Servicio general'}
                            </div>
                            <div className="ml-2 flex-shrink-0 flex">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(service.status)}`}>
                                {getStatusText(service.status)}
                              </span>
                            </div>
                          </div>
                          <div className="mt-2 sm:flex sm:justify-between">
                            <div className="sm:flex">
                              <p className="text-sm text-gray-500">
                                {service.clientName || 'Cliente'} 
                                {service.technicianName && ` • Técnico: ${service.technicianName}`}
                              </p>
                            </div>
                            <div className="mt-2 text-sm text-gray-500 sm:mt-0">
                              <p>
                                {service.createdAt ? new Date(service.createdAt.toDate()).toLocaleDateString() : 'Fecha desconocida'}
                              </p>
                            </div>
                          </div>
                        </li>
                      ))
                    ) : (
                      <li className="px-4 py-4 sm:px-6 text-sm text-gray-500 text-center">
                        No hay servicios registrados
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
