'use client';

import { useState, useEffect } from 'react';
import { firestore } from '@/firebase/config';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import AdminLayout from '@/components/admin/AdminLayout';
import Link from 'next/link';

// Tipo para técnicos de Firestore
type FirestoreTechnician = {
  id: string;
  userType: 'technician';
  displayName?: string;
  email?: string;
  specialties?: string[];
  isActive?: boolean;
  isVerified?: boolean;
  photoURL?: string;
  rating?: number;
  reviewCount?: number;
  createdAt?: { toDate: () => Date };
  // Puedes agregar más campos relevantes aquí
};

export default function AdminTechnicians() {
  const [technicians, setTechnicians] = useState<FirestoreTechnician[]>([]);
  const [filteredTechnicians, setFilteredTechnicians] = useState<FirestoreTechnician[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [specialtyFilter, setSpecialtyFilter] = useState('all');
  const [specialties, setSpecialties] = useState<string[]>([]);

  useEffect(() => {
    const fetchTechnicians = async () => {
      try {
        // Consultar solo usuarios con tipo "technician"
        const q = query(
          collection(firestore, 'users'),
          where('userType', '==', 'technician')
        );
        const snapshot = await getDocs(q);
        const techData: FirestoreTechnician[] = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as FirestoreTechnician));
        
        // Ordenar por fecha de creación (más recientes primero)
        techData.sort((a, b) => {
          const dateA = a.createdAt?.toDate()?.getTime() || 0;
          const dateB = b.createdAt?.toDate()?.getTime() || 0;
          return dateB - dateA;
        });
        
        setTechnicians(techData);
        setFilteredTechnicians(techData);
        
        // Extraer todas las especialidades únicas
        const allSpecialties = techData
          .map(tech => tech.specialties || [])
          .flat()
          .filter((value: string, index: number, self: string[]) => 
            self.indexOf(value) === index
          );
        
        setSpecialties(allSpecialties);
      } catch (err) {
        console.error('Error fetching technicians:', err);
        setError('Error al cargar los técnicos. Por favor, inténtalo de nuevo más tarde.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTechnicians();
  }, []);

  useEffect(() => {
    let result = [...technicians];
    
    // Filtrar por término de búsqueda
    if (searchTerm) {
      result = result.filter(tech => 
        (tech.displayName && tech.displayName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (tech.email && tech.email.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    // Filtrar por estado
    if (statusFilter !== 'all') {
      const isActive = statusFilter === 'active';
      result = result.filter(tech => (tech.isActive ?? false) === isActive);
    }
    
    // Filtrar por especialidad
    if (specialtyFilter !== 'all') {
      result = result.filter(tech => 
        tech.specialties && tech.specialties.includes(specialtyFilter)
      );
    }
    
    setFilteredTechnicians(result);
  }, [searchTerm, statusFilter, specialtyFilter, technicians]);

  const toggleTechnicianStatus = async (techId: string, currentStatus: boolean | undefined) => {
    try {
      const newStatus = !(currentStatus ?? false);
      await updateDoc(doc(firestore, 'users', techId), {
        isActive: newStatus,
        updatedAt: new Date()
      });
      
      // Actualizar el estado local
      setTechnicians(technicians.map(tech => 
        tech.id === techId ? { ...tech, isActive: newStatus } : tech
      ));
      
      // Esto activará el useEffect para actualizar filteredTechnicians
    } catch (err) {
      console.error('Error toggling technician status:', err);
      setError('Error al actualizar el estado del técnico.');
    }
  };

  const getVerificationBadge = (isVerified: boolean) => {
    return isVerified ? (
      <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full flex items-center">
        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
        </svg>
        Verificado
      </span>
    ) : (
      <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
        No verificado
      </span>
    );
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900">Gestión de Técnicos</h1>
          <Link 
            href="/admin/technicians/add" 
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Añadir Técnico
          </Link>
        </div>
        
        {/* Filtros */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">Buscar técnicos</label>
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
                placeholder="Buscar por nombre o email"
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
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="specialty" className="block text-sm font-medium text-gray-700 mb-1">Especialidad</label>
            <select
              id="specialty"
              name="specialty"
              value={specialtyFilter}
              onChange={(e) => setSpecialtyFilter(e.target.value)}
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
              <option value="all">Todas las especialidades</option>
              {specialties.map((specialty, index) => (
                <option key={index} value={specialty}>{specialty}</option>
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
            {/* Conteo de técnicos */}
            <div className="mt-4">
              <p className="text-sm text-gray-500">
                Mostrando {filteredTechnicians.length} de {technicians.length} técnicos
              </p>
            </div>
            
            {/* Tabla de técnicos */}
            <div className="mt-4 flex flex-col">
              <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
                  <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Técnico
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Especialidades
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Verificación
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Estado
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Calificación
                          </th>
                          <th scope="col" className="relative px-6 py-3">
                            <span className="sr-only">Acciones</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredTechnicians.length > 0 ? (
                          filteredTechnicians.map((tech) => (
                            <tr key={tech.id}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="flex-shrink-0 h-10 w-10">
                                    {tech.photoURL ? (
                                      <img className="h-10 w-10 rounded-full" src={tech.photoURL} alt="" />
                                    ) : (
                                      <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                                        <span className="text-white text-lg font-medium">
                                          {(tech.displayName || tech.email || 'T').charAt(0).toUpperCase()}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                  <div className="ml-4">
                                    <div className="text-sm font-medium text-gray-900">
                                      {tech.displayName || 'Sin nombre'}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      {tech.email}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex flex-wrap gap-1">
                                  {tech.specialties && tech.specialties.length > 0 ? (
                                    tech.specialties.map((specialty: string, i: number) => (
                                      <span 
                                        key={i}
                                        className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded"
                                      >
                                        {specialty}
                                      </span>
                                    ))
                                  ) : (
                                    <span className="text-gray-500 text-sm">Sin especialidades</span>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {getVerificationBadge(tech.isVerified || false)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className={`h-2.5 w-2.5 rounded-full mr-2 ${tech.isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                  <span className="text-sm text-gray-900">
                                    {tech.isActive ? 'Activo' : 'Inactivo'}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.799-2.034c-.784-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                                  </svg>
                                  <span className="ml-1 text-sm font-medium text-gray-700">
                                    {tech.rating || '0'} ({tech.reviewCount || '0'})
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div className="flex justify-end space-x-2">
                                  <Link href={`/admin/technicians/${tech.id}`} className="text-blue-600 hover:text-blue-900">
                                    Detalles
                                  </Link>
                                  <button
                                    onClick={() => toggleTechnicianStatus(tech.id, tech.isActive)}
                                    className={tech.isActive ? "text-red-600 hover:text-red-900" : "text-green-600 hover:text-green-900"}
                                  >
                                    {tech.isActive ? 'Desactivar' : 'Activar'}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                              {!technicians.length ? (
                                'No hay técnicos registrados actualmente'
                              ) : (
                                'No se encontraron técnicos con los filtros actuales'
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
          </>
        )}
      </div>
    </AdminLayout>
  );
}
