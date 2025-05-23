'use client';

import { useState, useEffect } from 'react';
import { firestore } from '@/firebase/config';
import { collection, query, where, getDocs, orderBy, doc, updateDoc, getDoc } from 'firebase/firestore';
import Link from 'next/link';

interface TechnicianDashboardProps {
  userId: string;
}

export default function TechnicianDashboard({ userId }: TechnicianDashboardProps) {
  const [services, setServices] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    pending: 0,
    inProgress: 0,
    completed: 0
  });
  const [userSpecialties, setUserSpecialties] = useState<string[]>([]);
  const [userAreas, setUserAreas] = useState<string[]>([]);
  const [acceptingRequest, setAcceptingRequest] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Obtener datos del técnico actual para filtrar por especialidades
        const technicianDoc = await getDoc(doc(firestore, 'users', userId));
        if (!technicianDoc.exists()) {
          throw new Error('No se encontró información del técnico');
        }
        
        const technicianData = technicianDoc.data();
        const specialties = technicianData.specialties || [];
        const areas = technicianData.serviceAreas || [];
        
        setUserSpecialties(specialties);
        setUserAreas(areas);
        
        // Consultar servicios asignados a este técnico
        const q = query(
          collection(firestore, 'services'),
          where('technicianId', '==', userId),
          orderBy('createdAt', 'desc')
        );

        const snapshot = await getDocs(q);
        const servicesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setServices(servicesData);

        // Calcular estadísticas
        const pendingCount = servicesData.filter(s => s.status === 'accepted').length;
        const inProgressCount = servicesData.filter(s => s.status === 'in_progress').length;
        const completedCount = servicesData.filter(s => s.status === 'completed').length;

        setStats({
          pending: pendingCount,
          inProgress: inProgressCount,
          completed: completedCount
        });
        
        // Obtener solicitudes pendientes que coincidan con las especialidades del técnico
        await fetchPendingRequests(specialties, areas);
      } catch (err) {
        console.error('Error al obtener servicios:', err);
        setError('No se pudieron cargar los servicios. Inténtalo de nuevo más tarde.');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchData();
    }
  }, [userId]);

  // Función para obtener solicitudes pendientes
  const fetchPendingRequests = async (specialties: string[], areas: string[]) => {
    try {
      // Consulta base: servicios con estado "pending"
      const pendingQuery = query(
        collection(firestore, 'services'),
        where('status', '==', 'pending'),
        orderBy('createdAt', 'desc')
      );
      
      const pendingSnapshot = await getDocs(pendingQuery);
      const pendingServices = pendingSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAtFormatted: doc.data().createdAt ? new Date(doc.data().createdAt.toDate()).toLocaleDateString() : 'Fecha desconocida'
      }));
      
      // Filtrar solicitudes que coincidan con especialidades y áreas del técnico
      const filteredRequests = pendingServices.filter(service => {
        // Si el técnico no tiene especialidades definidas, mostrar todas las solicitudes
        if (specialties.length === 0) return true;
        
        // Verificar si coincide la especialidad
        const matchesSpecialty = !service.serviceType || specialties.includes(service.serviceType);
        
        // Verificar si coincide el área
        const matchesArea = !service.serviceArea || areas.length === 0 || areas.includes(service.serviceArea);
        
        return matchesSpecialty && matchesArea;
      });
      
      setPendingRequests(filteredRequests);
    } catch (error) {
      console.error('Error fetching pending requests:', error);
    }
  };

  const updateServiceStatus = async (serviceId: string, newStatus: string) => {
    try {
      await updateDoc(doc(firestore, 'services', serviceId), {
        status: newStatus,
        updatedAt: new Date()
      });

      // Actualizar la UI
      setServices(services.map(service => 
        service.id === serviceId ? { ...service, status: newStatus } : service
      ));

      // Actualizar estadísticas
      const updatedServices = services.map(service => 
        service.id === serviceId ? { ...service, status: newStatus } : service
      );
      
      const pendingCount = updatedServices.filter(s => s.status === 'accepted').length;
      const inProgressCount = updatedServices.filter(s => s.status === 'in_progress').length;
      const completedCount = updatedServices.filter(s => s.status === 'completed').length;

      setStats({
        pending: pendingCount,
        inProgress: inProgressCount,
        completed: completedCount
      });
    } catch (err) {
      console.error('Error al actualizar el estado del servicio:', err);
      setError('No se pudo actualizar el estado. Inténtalo de nuevo más tarde.');
    }
  };

  // Función para aceptar una solicitud
  const acceptRequest = async (requestId: string) => {
    setAcceptingRequest(true);
    
    try {
      const technicianDoc = await getDoc(doc(firestore, 'users', userId));
      if (!technicianDoc.exists()) {
        throw new Error('No se encontró información del técnico');
      }
      
      const technicianData = technicianDoc.data();
      
      // Actualizar el estado del servicio
      await updateDoc(doc(firestore, 'services', requestId), {
        status: 'accepted',
        technicianId: userId,
        technicianName: technicianData.displayName || 'Técnico',
        technicianEmail: technicianData.email,
        updatedAt: new Date()
      });
      
      // Eliminar la solicitud de pendingRequests
      setPendingRequests(prev => prev.filter(req => req.id !== requestId));
      
      // Refrescar la lista de servicios del técnico
      const q = query(
        collection(firestore, 'services'),
        where('technicianId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      const servicesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setServices(servicesData);
      
      // Actualizar estadísticas
      const pendingCount = servicesData.filter(s => s.status === 'accepted').length;
      const inProgressCount = servicesData.filter(s => s.status === 'in_progress').length;
      const completedCount = servicesData.filter(s => s.status === 'completed').length;
      
      setStats({
        pending: pendingCount,
        inProgress: inProgressCount,
        completed: completedCount
      });
    } catch (err) {
      console.error('Error accepting request:', err);
      setError('Error al aceptar la solicitud');
    } finally {
      setAcceptingRequest(false);
    }
  };

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
      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
              <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-5">
              <p className="text-sm font-medium text-gray-500 truncate">Servicios pendientes</p>
              <p className="mt-1 text-3xl font-semibold text-gray-900">{stats.pending}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-purple-500 rounded-md p-3">
              <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="ml-5">
              <p className="text-sm font-medium text-gray-500 truncate">En progreso</p>
              <p className="mt-1 text-3xl font-semibold text-gray-900">{stats.inProgress}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
              <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-5">
              <p className="text-sm font-medium text-gray-500 truncate">Completados</p>
              <p className="mt-1 text-3xl font-semibold text-gray-900">{stats.completed}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Sección de solicitudes pendientes */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-medium mb-4">Solicitudes disponibles</h2>
        
        {loading ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : pendingRequests.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Servicio
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ubicación
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pendingRequests.map(request => (
                  <tr key={request.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{request.serviceType || 'Servicio general'}</div>
                      <div className="text-xs text-gray-500">{request.description?.substring(0, 50)}...</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {request.clientName || 'Cliente'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {request.serviceArea || request.location || 'No especificada'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {request.createdAtFormatted}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex space-x-3 justify-end">
                        <Link 
                          href={`/services/${request.id}`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Detalles
                        </Link>
                        <button
                          onClick={() => acceptRequest(request.id)}
                          disabled={acceptingRequest}
                          className="text-green-600 hover:text-green-900 disabled:opacity-50"
                        >
                          {acceptingRequest ? 'Procesando...' : 'Aceptar'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">No hay solicitudes disponibles actualmente</p>
        )}
        
        <div className="mt-4">
          <Link href="/technician/requests" className="text-blue-600 hover:text-blue-700">
            Ver todas las solicitudes disponibles →
          </Link>
        </div>
      </div>

      {/* Sección de servicios asignados */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-medium">Mis Servicios</h2>
          <Link 
            href="/technician/profile" 
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
          >
            Actualizar Perfil Técnico
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-6">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <p className="text-red-500 text-center py-4">{error}</p>
        ) : services.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Servicio
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {services.map((service) => (
                  <tr key={service.id}>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{service.serviceType || 'Servicio general'}</div>
                      <div className="text-sm text-gray-500">{service.description?.substring(0, 50)}...</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {service.clientName || 'Cliente'}
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
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex space-x-2 justify-end">
                        <Link href={`/services/${service.id}`} className="text-blue-600 hover:text-blue-900">
                          Detalles
                        </Link>
                        
                        {service.status === 'accepted' && (
                          <button
                            onClick={() => updateServiceStatus(service.id, 'in_progress')}
                            className="text-purple-600 hover:text-purple-900"
                          >
                            Iniciar
                          </button>
                        )}
                        
                        {service.status === 'in_progress' && (
                          <button
                            onClick={() => updateServiceStatus(service.id, 'completed')}
                            className="text-green-600 hover:text-green-900"
                          >
                            Completar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-gray-500">No tienes servicios asignados actualmente.</p>
          </div>
        )}
      </div>

      {/* Sección de consejos o información útil */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-medium mb-4">Consejos para técnicos</h2>
        <ul className="space-y-2 text-gray-600">
          <li className="flex items-start">
            <svg className="flex-shrink-0 h-5 w-5 text-green-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <span className="ml-2">Mantén tu perfil actualizado para recibir más solicitudes de servicio.</span>
          </li>
          <li className="flex items-start">
            <svg className="flex-shrink-0 h-5 w-5 text-green-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <span className="ml-2">Comunícate con los clientes de manera clara y profesional.</span>
          </li>
          <li className="flex items-start">
            <svg className="flex-shrink-0 h-5 w-5 text-green-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <span className="ml-2">Pide a tus clientes que te califiquen después de completar un servicio.</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
