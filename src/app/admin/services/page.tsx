'use client';

import { useState, useEffect } from 'react';
import { firestore } from '@/firebase/config';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import AdminLayout from '@/components/admin/AdminLayout';
import Link from 'next/link';

// Tipo para servicios de Firestore
type FirestoreService = {
  id: string;
  serviceType: string;
  description?: string;
  clientName?: string;
  technicianName?: string;
  clientEmail?: string;
  technicianEmail?: string;
  status: string;
  createdAt?: { toDate: () => number };
  // Puedes agregar más campos relevantes aquí
};

export default function AdminServices() {
  const [services, setServices] = useState<FirestoreService[]>([]);
  const [filteredServices, setFilteredServices] = useState<FirestoreService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [serviceTypes, setServiceTypes] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const servicesSnapshot = await getDocs(collection(firestore, 'services'));
        const servicesData: FirestoreService[] = servicesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as FirestoreService));
        
        // Ordenar por fecha de creación (más recientes primero)
        servicesData.sort((a, b) => {
          const dateA = a.createdAt?.toDate() || 0;
          const dateB = b.createdAt?.toDate() || 0;
          return dateB - dateA;
        });
        
        setServices(servicesData);
        setFilteredServices(servicesData);
        
        // Extraer todos los tipos de servicio únicos
        const types = servicesData
          .map(service => service.serviceType)
          .filter((value: string, index: number, self: string[]) => 
            value && self.indexOf(value) === index
          );
        
        setServiceTypes(types);
      } catch (err) {
        console.error('Error fetching services:', err);
        setError('Error al cargar los servicios. Por favor, inténtalo de nuevo más tarde.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchServices();
  }, []);

  useEffect(() => {
    let result = [...services];
    
    // Filtrar por término de búsqueda
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter(service => 
        (service.serviceType && service.serviceType.toLowerCase().includes(searchLower)) ||
        (service.description && service.description.toLowerCase().includes(searchLower)) ||
        (service.clientName && service.clientName.toLowerCase().includes(searchLower)) ||
        (service.technicianName && service.technicianName.toLowerCase().includes(searchLower))
      );
    }
    
    // Filtrar por estado
    if (statusFilter !== 'all') {
      result = result.filter(service => service.status === statusFilter);
    }
    
    // Filtrar por tipo de servicio
    if (typeFilter !== 'all') {
      result = result.filter(service => service.serviceType === typeFilter);
    }
    
    setFilteredServices(result);
    setPage(1); // Resetear a la primera página cuando cambian los filtros
  }, [searchTerm, statusFilter, typeFilter, services]);

  const getPaginatedServices = () => {
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredServices.slice(startIndex, endIndex);
  };

  const totalPages = Math.ceil(filteredServices.length / itemsPerPage);

  const updateServiceStatus = async (serviceId: string, newStatus: string) => {
    try {
      await updateDoc(doc(firestore, 'services', serviceId), {
        status: newStatus,
        updatedAt: new Date()
      });
      
      // Actualizar el estado local
      setServices(services.map(service => 
        service.id === serviceId ? { ...service, status: newStatus } : service
      ));
    } catch (err) {
      console.error('Error updating service status:', err);
      setError('Error al actualizar el estado del servicio.');
    }
  };

  const deleteService = async (serviceId: string) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este servicio? Esta acción no se puede deshacer.')) {
      return;
    }
    
    try {
      await deleteDoc(doc(firestore, 'services', serviceId));
      
      // Actualizar el estado local
      setServices(services.filter(service => service.id !== serviceId));
      
    } catch (err) {
      console.error('Error deleting service:', err);
      setError('Error al eliminar el servicio.');
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
    <AdminLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900">Gestión de Servicios</h1>
          <Link 
            href="/admin/services/create"
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Crear Servicio
          </Link>
        </div>
        
        {/* Filtros */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">Buscar servicios</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                name="search"
                id="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                placeholder="Buscar por descripción, cliente o técnico"
              />
            </div>
          </div>
          
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
            <select
              id="status"
              name="status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
              <option value="all">Todos los estados</option>
              <option value="pending">Pendiente</option>
              <option value="accepted">Aceptado</option>
              <option value="in_progress">En progreso</option>
              <option value="completed">Completado</option>
              <option value="cancelled">Cancelado</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="serviceType" className="block text-sm font-medium text-gray-700 mb-1">Tipo de servicio</label>
            <select
              id="serviceType"
              name="serviceType"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
              <option value="all">Todos los servicios</option>
              {serviceTypes.map((type, index) => (
                <option key={index} value={type}>{type}</option>
              ))}
            </select>
          </div>
        </div>
        
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
            {/* Conteo de servicios */}
            <div className="mt-4">
              <p className="text-sm text-gray-500">
                Mostrando {filteredServices.length} de {services.length} servicios
              </p>
            </div>
            
            {/* Tabla de servicios */}
            <div className="mt-4 flex flex-col">
              <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
                  <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
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
                            Técnico
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
                        {getPaginatedServices().length > 0 ? (
                          getPaginatedServices().map((service) => (
                            <tr key={service.id}>
                              <td className="px-6 py-4">
                                <div className="flex items-start flex-col">
                                  <div className="text-sm font-medium text-gray-900">{service.serviceType || 'Servicio'}</div>
                                  <div className="text-sm text-gray-500 mt-1">
                                    {service.description ? (service.description.length > 50 ? service.description.substring(0, 50) + '...' : service.description) : 'Sin descripción'}
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">{service.clientName || 'Cliente'}</div>
                                <div className="text-sm text-gray-500">{service.clientEmail || 'Sin email'}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {service.technicianName ? (
                                  <div>
                                    <div className="text-sm font-medium text-gray-900">{service.technicianName}</div>
                                    <div className="text-sm text-gray-500">{service.technicianEmail || ''}</div>
                                  </div>
                                ) : (
                                  <span className="text-sm text-gray-500">Sin asignar</span>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {service.createdAt ? new Date(service.createdAt.toDate()).toLocaleDateString() : 'Fecha desconocida'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(service.status)}`}>
                                  {getStatusText(service.status)}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div className="flex justify-end space-x-3">
                                  <Link href={`/admin/services/${service.id}`} className="text-blue-600 hover:text-blue-900">
                                    Detalles
                                  </Link>
                                  {service.status !== 'completed' && service.status !== 'cancelled' && (
                                    <div className="relative">
                                      <button 
                                        className="text-indigo-600 hover:text-indigo-900 focus:outline-none"
                                        onClick={() => {
                                          const menu = document.getElementById(`status-menu-${service.id}`);
                                          if (menu) {
                                            menu.classList.toggle('hidden');
                                          }
                                        }}
                                      >
                                        Cambiar estado
                                      </button>
                                      <div 
                                        id={`status-menu-${service.id}`}
                                        className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none hidden z-10"
                                      >
                                        <div className="py-1">
                                          {service.status !== 'accepted' && (
                                            <button
                                              onClick={() => {
                                                updateServiceStatus(service.id, 'accepted');
                                                document.getElementById(`status-menu-${service.id}`)?.classList.add('hidden');
                                              }}
                                              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                            >
                                              Marcar como Aceptado
                                            </button>
                                          )}
                                          {service.status !== 'in_progress' && (
                                            <button
                                              onClick={() => {
                                                updateServiceStatus(service.id, 'in_progress');
                                                document.getElementById(`status-menu-${service.id}`)?.classList.add('hidden');
                                              }}
                                              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                            >
                                              Marcar como En Progreso
                                            </button>
                                          )}
                                          <button
                                            onClick={() => {
                                              updateServiceStatus(service.id, 'completed');
                                              document.getElementById(`status-menu-${service.id}`)?.classList.add('hidden');
                                            }}
                                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                          >
                                            Marcar como Completado
                                          </button>
                                          <button
                                            onClick={() => {
                                              updateServiceStatus(service.id, 'cancelled');
                                              document.getElementById(`status-menu-${service.id}`)?.classList.add('hidden');
                                            }}
                                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                          >
                                            Cancelar servicio
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                  <button
                                    onClick={() => deleteService(service.id)}
                                    className="text-red-600 hover:text-red-900"
                                  >
                                    Eliminar
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                              {services.length === 0 ? (
                                'No hay servicios registrados actualmente'
                              ) : (
                                'No se encontraron servicios con los filtros actuales'
                              )}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Paginación */}
            {totalPages > 1 && (
              <nav className="flex items-center justify-between border-t border-gray-200 px-4 sm:px-0 mt-6">
                <div className="-mt-px w-0 flex-1 flex">
                  <button
                    onClick={() => setPage(Math.max(page - 1, 1))}
                    disabled={page === 1}
                    className="border-t-2 border-transparent pt-4 pr-1 inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="mr-3 h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M18 10a.75.75 0 01-.75.75H4.66l2.1 1.95a.75.75 0 11-1.02 1.1l-3.5-3.25a.75.75 0 010-1.1l3.5-3.25a.75.75 0 111.02 1.1l-2.1 1.95h12.59A.75.75 0 0118 10z" clipRule="evenodd" />
                    </svg>
                    Anterior
                  </button>
                </div>
                <div className="hidden md:-mt-px md:flex">
                  {Array.from({ length: totalPages }).map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setPage(idx + 1)}
                      className={`${
                        page === idx + 1
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      } border-t-2 pt-4 px-4 inline-flex items-center text-sm font-medium`}
                    >
                      {idx + 1}
                    </button>
                  ))}
                </div>
                <div className="-mt-px w-0 flex-1 flex justify-end">
                  <button
                    onClick={() => setPage(Math.min(page + 1, totalPages))}
                    disabled={page === totalPages}
                    className="border-t-2 border-transparent pt-4 pl-1 inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Siguiente
                    <svg className="ml-3 h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M2 10a.75.75 0 01.75-.75h12.59l-2.1-1.95a.75.75 0 111.02-1.1l3.5 3.25a.75.75 0 010 1.1l-3.5 3.25a.75.75 0 11-1.02-1.1l2.1-1.95H2.75A.75.75 0 012 10z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </nav>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}
