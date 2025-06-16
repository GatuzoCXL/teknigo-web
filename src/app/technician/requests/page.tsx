'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, updateDoc, orderBy, getDoc } from 'firebase/firestore';
import { firestore, auth } from '@/firebase/config';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Link from 'next/link';

interface ServiceRequest {
  id: string;
  status: string;
  technicianId?: string;
  technicianName?: string;
  technicianEmail?: string;
  createdAt: {
    toDate: () => Date;
  };
  [key: string]: any;
}

export default function ServiceRequests() {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');
  const [userId, setUserId] = useState<string | null>(null);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      setUserId(user.uid);
    }
  }, []);

  useEffect(() => {
    const fetchRequests = async () => {
      if (!userId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // Modificado para evitar el error
        // Primero, obtener todas las solicitudes con status pending
        let requestsQuery = query(
          collection(firestore, 'services'),
          where('status', '==', 'pending')
        );
        
        // Si hay un problema con los índices, podemos separar las consultas
        if (filter === 'all' || filter === 'pending') {
          requestsQuery = query(
            collection(firestore, 'services'),
            where('status', '==', 'pending')
            // Quitamos el orderBy temporalmente hasta que el índice esté listo
          );
        } else if (filter === 'accepted') {
          requestsQuery = query(
            collection(firestore, 'services'),
            where('status', '==', 'accepted')
          );
        } else if (filter === 'in_progress') {
          requestsQuery = query(
            collection(firestore, 'services'),
            where('status', '==', 'in_progress')
          );
        } else if (filter === 'mine') {
          requestsQuery = query(
            collection(firestore, 'services'),
            where('technicianId', '==', userId)
          );
        }

        const snapshot = await getDocs(requestsQuery);
        const requestsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as ServiceRequest[];
        
        // Ordenar manualmente por fecha de creación (más recientes primero)
        requestsData.sort((a, b) => {
          if (!a.createdAt || !b.createdAt) return 0;
          const dateA = a.createdAt.toDate().getTime();
          const dateB = b.createdAt.toDate().getTime();
          return dateB - dateA;
        });
        
        setRequests(requestsData);
      } catch (err) {
        console.error('Error fetching service requests:', err);
        setError('Error al cargar las solicitudes de servicio. Inténtalo de nuevo más tarde.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchRequests();
  }, [userId, filter]);

  const acceptRequest = async (requestId: string) => {
    if (!userId) return;
    
    try {
      const user = auth.currentUser;
      // Error corregido aquí: cambio de getDocs a getDoc
      const userDoc = await getDoc(doc(firestore, 'users', userId));
      const userData = userDoc.exists() ? userDoc.data() : null;
      
      // Actualizar el estado del servicio
      await updateDoc(doc(firestore, 'services', requestId), {
        status: 'accepted',
        technicianId: userId,
        technicianName: userData?.displayName || user?.displayName || 'Técnico',
        technicianEmail: userData?.email || user?.email,
        updatedAt: new Date()
      });
      
      // Actualizar la lista local
      setRequests(requests.map(request => 
        request.id === requestId 
          ? { 
              ...request, 
              status: 'accepted', 
              technicianId: userId,
              technicianName: userData?.displayName || user?.displayName || 'Técnico',
            } 
          : request
      ));
      
      // Mostrar notificación de éxito
      setMessage({
        type: 'success',
        text: 'Solicitud aceptada correctamente'
      });
      
      // Ocultar el mensaje después de unos segundos
      setTimeout(() => setMessage(null), 3000);
      
    } catch (err) {
      console.error('Error accepting request:', err);
      setError('Error al aceptar la solicitud');
    }
  };

  const filteredRequests = requests.filter(request => {
    if (filter === 'all') return true;
    if (filter === 'pending') return request.status === 'pending';
    if (filter === 'accepted') return request.status === 'accepted';
    if (filter === 'in_progress') return request.status === 'in_progress';
    if (filter === 'mine') return request.technicianId === userId;
    return true;
  });

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
    <ProtectedRoute technicianAllowed={true}>
      <div className="min-h-screen bg-gray-100">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <div className="md:flex md:items-center md:justify-between">
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold leading-tight text-gray-900">
                  Solicitudes de Servicio
                </h1>
              </div>
              <div className="mt-4 flex md:mt-0 md:ml-4">
                <Link
                  href="/dashboard"
                  className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Volver al Dashboard
                </Link>
              </div>
            </div>
          </div>
        </header>
        
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {/* Mensajes de notificación */}
          {message && (
            <div className={`mb-4 p-4 rounded-md ${
              message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' 
                                       : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {message.text}
            </div>
          )}
          
          {/* Error */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Filtros */}
          <div className="pb-5 border-b border-gray-200 sm:flex sm:items-center sm:justify-between">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Solicitudes disponibles
            </h3>
            <div className="mt-3 sm:mt-0 sm:ml-4">
              <select
                id="filter"
                name="filter"
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="all">Todas las solicitudes</option>
                <option value="pending">Pendientes</option>
                <option value="mine">Mis solicitudes</option>
              </select>
            </div>
          </div>
          
          {/* Contenido principal */}
          <div className="mt-6">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : error ? (
              <div className="rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      {error}
                    </h3>
                  </div>
                </div>
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No hay solicitudes de servicio</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {filter !== 'all' ? 'Intenta cambiar los filtros de búsqueda.' : 'Aún no hay solicitudes disponibles para ti.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filteredRequests.map((request) => (
                  <div key={request.id} className="bg-white overflow-hidden shadow rounded-lg divide-y divide-gray-200">
                    <div className="px-4 py-5 sm:px-6">
                      <div className="flex justify-between">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">
                          {request.serviceType || 'Servicio general'}
                        </h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(request.status)}`}>
                          {getStatusText(request.status)}
                        </span>
                      </div>
                      <p className="mt-1 max-w-2xl text-sm text-gray-500">
                        {request.createdAtFormatted}
                      </p>
                    </div>
                    <div className="px-4 py-5 sm:p-6 space-y-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Cliente</h4>
                        <p className="mt-1 text-sm text-gray-900">{request.clientName || 'Cliente'}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Ubicación</h4>
                        <p className="mt-1 text-sm text-gray-900">{request.location || request.serviceArea || 'No especificada'}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Descripción</h4>
                        <p className="mt-1 text-sm text-gray-900 line-clamp-3">{request.description || 'Sin descripción'}</p>
                      </div>
                      {request.budget && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">Presupuesto</h4>
                          <p className="mt-1 text-sm text-gray-900">${request.budget} PEN</p>
                        </div>
                      )}
                    </div>
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex justify-between">
                        <Link
                          href={`/services/${request.id}`}
                          className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          Ver detalles
                        </Link>
                        
                        {request.status === 'pending' ? (
                          <button
                            onClick={() => acceptRequest(request.id)}
                            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          >
                            Aceptar servicio
                          </button>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium">
                            {request.technicianId === userId ? 'Asignado a ti' : 'Ya asignado'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
