'use client';

import { useState, useEffect } from 'react';
import { firestore } from '@/firebase/config';
import { collection, getDocs, query, where, orderBy, limit, getDoc, doc } from 'firebase/firestore';
import AdminLayout from '@/components/admin/AdminLayout';

interface StatsData {
  totalUsers: number;
  totalClients: number;
  totalTechnicians: number;
  totalServices: number;
  completedServices: number;
  pendingServices: number;
  servicesByMonth: Record<string, number>;
  servicesByType: Record<string, number>;
  averageRating: number;
  topTechnicians: Array<{
    id: string;
    displayName: string;
    rating: number;
    completedServices: number;
  }>;
}

export default function AdminStats() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<StatsData>({
    totalUsers: 0,
    totalClients: 0,
    totalTechnicians: 0,
    totalServices: 0,
    completedServices: 0,
    pendingServices: 0,
    servicesByMonth: {},
    servicesByType: {},
    averageRating: 0,
    topTechnicians: [],
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // 1. Obtener todos los usuarios
        const usersSnapshot = await getDocs(collection(firestore, 'users'));
        const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Calcular estadísticas de usuarios
        const totalUsers = users.length;
        const totalClients = users.filter(user => user.userType === 'client').length;
        const totalTechnicians = users.filter(user => user.userType === 'technician').length;

        // 2. Obtener todos los servicios
        const servicesSnapshot = await getDocs(collection(firestore, 'services'));
        const services = servicesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Calcular estadísticas de servicios
        const totalServices = services.length;
        const completedServices = services.filter(service => service.status === 'completed').length;
        const pendingServices = services.filter(service => service.status === 'pending' || service.status === 'accepted').length;

        // 3. Agrupar servicios por mes
        const servicesByMonth: Record<string, number> = {};
        services.forEach(service => {
          if (service.createdAt) {
            const date = new Date(service.createdAt.toDate());
            const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`;
            servicesByMonth[monthYear] = (servicesByMonth[monthYear] || 0) + 1;
          }
        });

        // 4. Agrupar servicios por tipo
        const servicesByType: Record<string, number> = {};
        services.forEach(service => {
          const serviceType = service.serviceType || 'No especificado';
          servicesByType[serviceType] = (servicesByType[serviceType] || 0) + 1;
        });

        // 5. Obtener datos de reseñas para calcular calificación promedio
        const reviewsSnapshot = await getDocs(collection(firestore, 'reviews'));
        const reviews = reviewsSnapshot.docs.map(doc => doc.data());
        
        const totalRatings = reviews.reduce((acc, review) => acc + (review.rating || 0), 0);
        const averageRating = reviews.length > 0 ? totalRatings / reviews.length : 0;

        // 6. Encontrar los mejores técnicos (más servicios completados y mejor calificados)
        const technicians = users.filter(user => user.userType === 'technician');
        
        // Para cada técnico, contar servicios completados
        const technicianStats = await Promise.all(technicians.map(async (tech) => {
          // Contar servicios completados por este técnico
          const techServicesQuery = query(
            collection(firestore, 'services'),
            where('technicianId', '==', tech.id),
            where('status', '==', 'completed')
          );
          const techServicesSnapshot = await getDocs(techServicesQuery);
          const completedCount = techServicesSnapshot.docs.length;

          // Obtener calificaciones de este técnico
          const techReviewsQuery = query(
            collection(firestore, 'reviews'),
            where('technicianId', '==', tech.id)
          );
          const techReviewsSnapshot = await getDocs(techReviewsQuery);
          const techReviews = techReviewsSnapshot.docs.map(doc => doc.data());
          
          const totalTechRating = techReviews.reduce((acc, review) => acc + (review.rating || 0), 0);
          const avgTechRating = techReviews.length > 0 ? totalTechRating / techReviews.length : 0;

          return {
            id: tech.id,
            displayName: tech.displayName || 'Sin nombre',
            completedServices: completedCount,
            rating: avgTechRating
          };
        }));

        // Ordenar técnicos por calificación y servicios completados
        const topTechnicians = technicianStats
          .filter(tech => tech.completedServices > 0) // Solo mostrar técnicos con servicios completados
          .sort((a, b) => {
            // Primero por calificación, luego por servicios completados
            if (b.rating !== a.rating) return b.rating - a.rating;
            return b.completedServices - a.completedServices;
          })
          .slice(0, 5); // Top 5

        // 7. Actualizar el estado con todos los datos
        setStats({
          totalUsers,
          totalClients,
          totalTechnicians,
          totalServices,
          completedServices,
          pendingServices,
          servicesByMonth,
          servicesByType,
          averageRating,
          topTechnicians
        });

      } catch (err) {
        console.error('Error fetching statistics:', err);
        setError('Error al cargar las estadísticas. Por favor, inténtalo de nuevo más tarde.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Función para generar colores dinámicos diferentes para cada categoría
  const generateColor = (index: number) => {
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 
      'bg-purple-500', 'bg-red-500', 'bg-indigo-500',
      'bg-pink-500', 'bg-teal-500'
    ];
    return colors[index % colors.length];
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold text-gray-900">Estadísticas de Teknigo</h1>
        
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
          <div className="mt-6 space-y-8">
            {/* Resumen general */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="bg-white shadow rounded-lg p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-blue-500 rounded-md p-2">
                    <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-500">Total Usuarios</p>
                    <p className="text-lg font-semibold text-gray-900">{stats.totalUsers}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white shadow rounded-lg p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-green-500 rounded-md p-2">
                    <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-500">Clientes</p>
                    <p className="text-lg font-semibold text-gray-900">{stats.totalClients}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white shadow rounded-lg p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-purple-500 rounded-md p-2">
                    <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-500">Técnicos</p>
                    <p className="text-lg font-semibold text-gray-900">{stats.totalTechnicians}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white shadow rounded-lg p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-yellow-500 rounded-md p-2">
                    <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-500">Total Servicios</p>
                    <p className="text-lg font-semibold text-gray-900">{stats.totalServices}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white shadow rounded-lg p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-green-500 rounded-md p-2">
                    <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-500">Completados</p>
                    <p className="text-lg font-semibold text-gray-900">{stats.completedServices}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white shadow rounded-lg p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-red-500 rounded-md p-2">
                    <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-500">Pendientes</p>
                    <p className="text-lg font-semibold text-gray-900">{stats.pendingServices}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Servicios por tipo */}
              <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="px-4 py-5 sm:px-6">
                  <h3 className="text-lg font-medium text-gray-900">Servicios por tipo</h3>
                </div>
                <div className="px-4 py-5 sm:p-6">
                  {Object.keys(stats.servicesByType).length > 0 ? (
                    <div className="space-y-4">
                      {Object.entries(stats.servicesByType)
                        .sort((a, b) => b[1] - a[1]) // Ordenar por cantidad (mayor primero)
                        .map(([type, count], index) => {
                          // Calcular porcentaje para la anchura de la barra
                          const maxCount = Math.max(...Object.values(stats.servicesByType));
                          const percentage = (count / maxCount) * 100;
                          
                          return (
                            <div key={type} className="relative">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium text-gray-700 truncate">{type}</span>
                                <span className="text-sm font-medium text-gray-700">{count}</span>
                              </div>
                              <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200">
                                <div 
                                  style={{ width: `${percentage}%` }} 
                                  className={`${generateColor(index)} rounded`}
                                ></div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center">No hay datos de servicios por tipo disponibles</p>
                  )}
                </div>
              </div>

              {/* Servicios por mes */}
              <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="px-4 py-5 sm:px-6">
                  <h3 className="text-lg font-medium text-gray-900">Servicios por mes</h3>
                </div>
                <div className="px-4 py-5 sm:p-6">
                  {Object.entries(stats.servicesByMonth).length > 0 ? (
                    <div className="flex items-end space-x-2">
                      {Object.entries(stats.servicesByMonth)
                        .sort(([a], [b]) => {
                          const [monthA, yearA] = a.split('/');
                          const [monthB, yearB] = b.split('/');
                          return (parseInt(yearA) - parseInt(yearB)) || (parseInt(monthA) - parseInt(monthB));
                        })
                        .slice(-6) // Mostrar solo los últimos 6 meses
                        .map(([month, count], index) => {
                          const maxValue = Math.max(...Object.values(stats.servicesByMonth));
                          const height = Math.max((count / maxValue) * 150, 20); // altura mínima de 20px
                          
                          return (
                            <div key={month} className="flex flex-col items-center flex-1">
                              <div 
                                className={`w-16 ${generateColor(index)}`} 
                                style={{ height: `${height}px` }}
                              ></div>
                              <div className="mt-2 text-xs font-medium text-gray-600">{month}</div>
                              <div className="text-sm font-semibold">{count}</div>
                            </div>
                          );
                        })}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center">No hay datos de servicios por mes disponibles</p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Calificación promedio */}
              <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="px-4 py-5 sm:px-6">
                  <h3 className="text-lg font-medium text-gray-900">Calificación promedio</h3>
                </div>
                <div className="px-4 py-5 sm:p-6 flex flex-col items-center">
                  <div className="text-5xl font-bold text-blue-600">
                    {stats.averageRating.toFixed(1)}
                  </div>
                  <div className="flex items-center mt-3">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg 
                        key={star}
                        className={`h-8 w-8 ${star <= Math.round(stats.averageRating) ? 'text-yellow-400' : 'text-gray-300'}`}
                        fill="currentColor" 
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <p className="text-sm text-gray-500 mt-4">
                    Basado en la calificación promedio de todos los servicios
                  </p>
                </div>
              </div>

              {/* Mejores técnicos */}
              <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="px-4 py-5 sm:px-6">
                  <h3 className="text-lg font-medium text-gray-900">Mejores Técnicos</h3>
                </div>
                <div className="px-4 py-5 sm:p-6">
                  {stats.topTechnicians.length > 0 ? (
                    <ul className="divide-y divide-gray-200">
                      {stats.topTechnicians.map((tech) => (
                        <li key={tech.id} className="py-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                <span className="text-lg font-medium text-gray-700">
                                  {tech.displayName.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{tech.displayName}</div>
                                <div className="text-sm text-gray-500">{tech.completedServices} servicios completados</div>
                              </div>
                            </div>
                            <div className="flex items-center">
                              <div className="flex items-center">
                                {[...Array(5)].map((_, i) => (
                                  <svg 
                                    key={i}
                                    className={`h-5 w-5 ${i < Math.floor(tech.rating) ? 'text-yellow-400' : 'text-gray-300'}`}
                                    fill="currentColor" 
                                    viewBox="0 0 20 20"
                                  >
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                  </svg>
                                ))}
                                <span className="ml-1 text-sm text-gray-500">{tech.rating.toFixed(1)}/5</span>
                              </div>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500 text-center">No hay datos de técnicos disponibles</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
