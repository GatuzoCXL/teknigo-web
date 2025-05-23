'use client';

import { useState, useEffect } from 'react';
import { firestore } from '@/firebase/config';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import Link from 'next/link';

interface ClientDashboardProps {
  userId: string;
}

export default function ClientDashboard({ userId }: ClientDashboardProps) {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        // Consultar servicios solicitados por este cliente
        const q = query(
          collection(firestore, 'services'),
          where('clientId', '==', userId),
          orderBy('createdAt', 'desc')
        );

        const snapshot = await getDocs(q);
        const servicesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setServices(servicesData);
      } catch (err) {
        console.error('Error al obtener servicios:', err);
        setError('No se pudieron cargar los servicios. Inténtalo de nuevo más tarde.');
      } finally {
        setLoading(false);
      }
    };

    // Llamar a la función fetchServices solo si hay un userId
    if (userId) {
      fetchServices();
    } else {
      setLoading(false);
    }
  }, [userId]);

  // Helper functions for status display
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
    <div className="space-y-6">
      {/* Botón para solicitar un nuevo servicio - siempre visible */}
      <div className="flex justify-end mb-4">
        <Link href="/services/request" className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
          <svg className="mr-2 -ml-1 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Solicitar nuevo servicio
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-6">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
              <button onClick={() => window.location.reload()} className="mt-2 text-sm font-medium text-red-700 hover:text-red-600">
                Reintentar
              </button>
            </div>
          </div>
        </div>
      ) : services.length > 0 ? (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Servicio
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Técnico
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Presupuesto
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {services.map((service) => (
                  <tr key={service.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{service.serviceType || 'Servicio general'}</div>
                      <div className="text-sm text-gray-500">{service.description?.substring(0, 50)}...</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {service.createdAt ? new Date(service.createdAt.toDate()).toLocaleDateString() : 'Fecha desconocida'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(service.status)}`}>
                        {getStatusText(service.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {service.technicianName || 'Sin asignar'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {service.budget ? `$${service.budget} PEN` : 'No especificado'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link href={`/services/${service.id}`} className="text-blue-600 hover:text-blue-900">
                        Detalles
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg p-6 text-center">
          <p className="text-gray-500">No tienes ningún servicio solicitado aún.</p>
          <Link href="/services/request" className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
            Solicitar un servicio
          </Link>
        </div>
      )}

      {/* Sección de consejos o información útil */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-medium mb-4">Consejos para clientes</h2>
        <ul className="space-y-2 text-gray-600">
          <li className="flex items-start">
            <svg className="flex-shrink-0 h-5 w-5 text-green-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <span className="ml-2">Describe tu problema con el mayor detalle posible para recibir el mejor servicio.</span>
          </li>
          <li className="flex items-start">
            <svg className="flex-shrink-0 h-5 w-5 text-green-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <span className="ml-2">Compara perfiles y calificaciones de varios técnicos antes de elegir.</span>
          </li>
          <li className="flex items-start">
            <svg className="flex-shrink-0 h-5 w-5 text-green-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <span className="ml-2">Mantén tu información de contacto actualizada para facilitar la comunicación con los técnicos.</span>
          </li>
          <li className="flex items-start">
            <svg className="flex-shrink-0 h-5 w-5 text-green-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <span className="ml-2">No olvides calificar y dejar una reseña después de recibir un servicio.</span>
          </li>
        </ul>
        
        <div className="mt-6">
          <Link href="/technicians" className="text-blue-600 hover:underline font-medium">
            Explorar directorio de técnicos →
          </Link>
        </div>
      </div>
    </div>
  );
}