'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { firestore } from '@/firebase/config';
import Link from 'next/link';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

interface Technician {
  id: string;
  displayName: string;
  photoURL: string | null;
  specialties: string[];
  serviceAreas: string[];
  rating: number;
  reviewCount: number;
  hourlyRate: number;
  bio: string;
  yearsExperience: number;
}

export default function TechnicianDirectory() {
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [filteredTechnicians, setFilteredTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [specialtyFilter, setSpecialtyFilter] = useState('all');
  const [areaFilter, setAreaFilter] = useState('all');
  const [sortBy, setSortBy] = useState('rating'); // 'rating', 'price_low', 'price_high', 'experience'
  
  // Opciones para filtros
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [areas, setAreas] = useState<string[]>([]);
  
  useEffect(() => {
    const fetchTechnicians = async () => {
      try {
        // Consultar solo usuarios de tipo técnico y que estén activos
        const q = query(
          collection(firestore, 'users'),
          where('userType', '==', 'technician'),
          where('isActive', '==', true)
        );
        
        const snapshot = await getDocs(q);
        const techData = snapshot.docs.map(doc => ({
          id: doc.id,
          displayName: doc.data().displayName || 'Técnico',
          photoURL: doc.data().photoURL || null,
          specialties: doc.data().specialties || [],
          serviceAreas: doc.data().serviceAreas || [],
          rating: doc.data().rating || 0,
          reviewCount: doc.data().reviewCount || 0,
          hourlyRate: doc.data().hourlyRate || 0,
          bio: doc.data().bio || '',
          yearsExperience: doc.data().yearsExperience || 0
        })) as Technician[];
        
        setTechnicians(techData);
        setFilteredTechnicians(techData);
        
        // Extraer todas las especialidades y áreas disponibles
        const allSpecialties = Array.from(new Set(techData.flatMap(tech => tech.specialties)));
        const allAreas = Array.from(new Set(techData.flatMap(tech => tech.serviceAreas)));
        
        setSpecialties(allSpecialties);
        setAreas(allAreas);
        
      } catch (err) {
        console.error('Error fetching technicians:', err);
        setError('Error al cargar los técnicos. Por favor, inténtalo de nuevo.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTechnicians();
  }, []);
  
  // Aplicar filtros
  useEffect(() => {
    let result = [...technicians];
    
    // Filtrar por término de búsqueda
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(tech => 
        tech.displayName.toLowerCase().includes(term) || 
        tech.bio.toLowerCase().includes(term) ||
        tech.specialties.some(s => s.toLowerCase().includes(term))
      );
    }
    
    // Filtrar por especialidad
    if (specialtyFilter !== 'all') {
      result = result.filter(tech => 
        tech.specialties.includes(specialtyFilter)
      );
    }
    
    // Filtrar por área
    if (areaFilter !== 'all') {
      result = result.filter(tech => 
        tech.serviceAreas.includes(areaFilter)
      );
    }
    
    // Ordenar resultados
    switch (sortBy) {
      case 'rating':
        result.sort((a, b) => b.rating - a.rating);
        break;
      case 'price_low':
        result.sort((a, b) => a.hourlyRate - b.hourlyRate);
        break;
      case 'price_high':
        result.sort((a, b) => b.hourlyRate - a.hourlyRate);
        break;
      case 'experience':
        result.sort((a, b) => b.yearsExperience - a.yearsExperience);
        break;
    }
    
    setFilteredTechnicians(result);
  }, [searchTerm, specialtyFilter, areaFilter, sortBy, technicians]);
  
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-100">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Encuentra técnicos calificados
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Explora nuestro directorio de técnicos especializados
            </p>
          </div>
        </header>
        
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {/* Filtros */}
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Filtros</h2>
            
            <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
              {/* Búsqueda */}
              <div>
                <label htmlFor="search" className="block text-sm font-medium text-gray-700">Buscar técnicos</label>
                <div className="mt-1 relative rounded-md shadow-sm">
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
                    placeholder="Nombre, especialidad..."
                  />
                </div>
              </div>
              
              {/* Filtro de especialidad */}
              <div>
                <label htmlFor="specialty" className="block text-sm font-medium text-gray-700">Especialidad</label>
                <select
                  id="specialty"
                  name="specialty"
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  value={specialtyFilter}
                  onChange={(e) => setSpecialtyFilter(e.target.value)}
                >
                  <option value="all">Todas las especialidades</option>
                  {specialties.map((specialty) => (
                    <option key={specialty} value={specialty}>{specialty}</option>
                  ))}
                </select>
              </div>
              
              {/* Filtro de área */}
              <div>
                <label htmlFor="area" className="block text-sm font-medium text-gray-700">Zona/Área</label>
                <select
                  id="area"
                  name="area"
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  value={areaFilter}
                  onChange={(e) => setAreaFilter(e.target.value)}
                >
                  <option value="all">Todas las zonas</option>
                  {areas.map((area) => (
                    <option key={area} value={area}>{area}</option>
                  ))}
                </select>
              </div>
              
              {/* Ordenar por */}
              <div>
                <label htmlFor="sortBy" className="block text-sm font-medium text-gray-700">Ordenar por</label>
                <select
                  id="sortBy"
                  name="sortBy"
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="rating">Mejor calificados</option>
                  <option value="price_low">Precio: menor a mayor</option>
                  <option value="price_high">Precio: mayor a menor</option>
                  <option value="experience">Experiencia</option>
                </select>
              </div>
            </div>
          </div>
          
          {/* Lista de técnicos */}
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
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
                  <button
                    onClick={() => window.location.reload()}
                    className="mt-2 text-sm font-medium text-red-700 hover:text-red-600"
                  >
                    Reintentar
                  </button>
                </div>
              </div>
            </div>
          ) : filteredTechnicians.length === 0 ? (
            <div className="bg-white shadow rounded-lg p-6 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No se encontraron técnicos</h3>
              <p className="mt-1 text-sm text-gray-500">
                No hay técnicos que coincidan con los filtros seleccionados.
              </p>
              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    setSpecialtyFilter('all');
                    setAreaFilter('all');
                  }}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Limpiar filtros
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTechnicians.map((technician) => (
                <div key={technician.id} className="bg-white shadow rounded-lg overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-14 w-14">
                        {technician.photoURL ? (
                          <img 
                            className="h-14 w-14 rounded-full object-cover" 
                            src={technician.photoURL} 
                            alt={technician.displayName} 
                          />
                        ) : (
                          <div className="h-14 w-14 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-xl">
                            {technician.displayName.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <h3 className="text-lg font-medium text-gray-900">{technician.displayName}</h3>
                        <div className="flex items-center mt-1">
                          {[...Array(5)].map((_, i) => (
                            <svg 
                              key={i} 
                              className={`h-4 w-4 ${i < Math.floor(technician.rating) ? 'text-yellow-500' : 'text-gray-300'}`} 
                              fill="currentColor" 
                              viewBox="0 0 20 20"
                            >
                              <path fillRule="evenodd" d="M10 15.585l-7.104 3.737a1 1 0 01-1.45-1.054l1.357-7.91-5.748-5.598a1 1 0 01.554-1.705l7.92-1.15 3.54-7.172a1 1 0 011.789 0l3.54 7.172 7.92 1.15a1 1 0 01.554 1.705l-5.748 5.598 1.357 7.91a1 1 0 01-1.45 1.054L10 15.585z" clipRule="evenodd" />
                            </svg>
                          ))}
                          <span className="ml-1 text-sm text-gray-500">
                            ({technician.reviewCount} {technician.reviewCount === 1 ? 'reseña' : 'reseñas'})
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <p className="text-sm text-gray-500 line-clamp-3">{technician.bio || 'Sin descripción'}</p>
                    </div>
                    
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-600">Especialidades</h4>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {technician.specialties.slice(0, 3).map((specialty, index) => (
                          <span 
                            key={index} 
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            {specialty}
                          </span>
                        ))}
                        {technician.specialties.length > 3 && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                            +{technician.specialties.length - 3} más
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="mt-4 flex justify-between items-center">
                      <div>
                        <span className="text-lg font-bold text-gray-900">${technician.hourlyRate}</span>
                        <span className="text-sm text-gray-500"> /hora</span>
                      </div>
                      <Link 
                        href={`/technicians/${technician.id}`}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-full shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Ver perfil
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
