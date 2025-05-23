'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { firestore, auth } from '@/firebase/config';
import Link from 'next/link';

export default function TechnicianDetails() {
  const params = useParams();
  const router = useRouter();
  const technicianId = params.id as string;
  
  const [technician, setTechnician] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setIsLoggedIn(!!user);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchTechnicianDetails = async () => {
      try {
        // Obtener datos del técnico
        const techDoc = await getDoc(doc(firestore, 'users', technicianId));
        
        if (!techDoc.exists()) {
          setError('El técnico no existe o ha sido eliminado');
          return;
        }
        
        const techData = techDoc.data();
        
        // Verificar si es un técnico
        if (techData.userType !== 'technician') {
          setError('El usuario solicitado no es un técnico');
          return;
        }
        
        setTechnician({
          id: techDoc.id,
          ...techData
        });
        
        // Obtener reseñas
        const reviewsQuery = query(
          collection(firestore, 'reviews'),
          where('technicianId', '==', technicianId),
          orderBy('createdAt', 'desc'),
          limit(5)
        );
        
        const reviewsSnapshot = await getDocs(reviewsQuery);
        const reviewsData = reviewsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate()
        }));
        
        setReviews(reviewsData);
        
      } catch (err) {
        console.error('Error fetching technician details:', err);
        setError('Error al cargar los detalles del técnico');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTechnicianDetails();
  }, [technicianId]);

  // Renderizado de estrellas de calificación
  const renderStars = (rating: number) => {
    return (
      <div className="flex">
        {[...Array(5)].map((_, i) => (
          <svg 
            key={i} 
            className={`h-5 w-5 ${i < Math.round(rating) ? 'text-yellow-400' : 'text-gray-300'}`} 
            fill="currentColor" 
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.799-2.034c-.784-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    );
  };

  // Formatear fecha
  const formatDate = (date: Date | null) => {
    if (!date) return 'Fecha desconocida';
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="bg-gray-100 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-4 py-5 sm:p-6 text-center">
              <svg className="mx-auto h-12 w-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-gray-900">{error}</h3>
              <div className="mt-6">
                <Link href="/technicians" className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                  Ver todos los técnicos
                </Link>
              </div>
            </div>
          </div>
        ) : technician ? (
          <div className="space-y-8">
            {/* Información principal del técnico */}
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6 bg-gradient-to-r from-blue-500 to-blue-700 text-white">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-20 w-20">
                      {technician.photoURL ? (
                        <img src={technician.photoURL} alt={technician.displayName} className="h-20 w-20 rounded-full object-cover" />
                      ) : (
                        <div className="h-20 w-20 rounded-full bg-blue-200 flex items-center justify-center text-blue-700 text-3xl font-bold">
                          {technician.displayName?.charAt(0) || 'T'}
                        </div>
                      )}
                    </div>
                    <div className="ml-6">
                      <h1 className="text-2xl font-bold">{technician.displayName || 'Técnico'}</h1>
                      <div className="flex items-center mt-1">
                        {renderStars(technician.rating || 0)}
                        <span className="ml-2 text-sm">{technician.rating || '0'}/5 ({technician.reviewCount || '0'} reseñas)</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 md:mt-0">
                    {isLoggedIn ? (
                      <Link 
                        href={`/services/request/${technicianId}`}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-blue-700 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white"
                      >
                        Solicitar servicio
                      </Link>
                    ) : (
                      <Link 
                        href="/login"
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-blue-700 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white"
                      >
                        Inicia sesión para solicitar
                      </Link>
                    )}
                  </div>
                </div>
              </div>
              <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Experiencia</dt>
                    <dd className="mt-1 text-sm text-gray-900">{technician.yearsExperience || '0'} años</dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Tarifa por hora</dt>
                    <dd className="mt-1 text-sm text-gray-900">${technician.hourlyRate || '0'} PEN</dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-sm font-medium text-gray-500">Acerca de</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {technician.bio || 'Este técnico aún no ha añadido una descripción.'}
                    </dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-sm font-medium text-gray-500">Especialidades</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      <div className="flex flex-wrap gap-2">
                        {technician.specialties?.length > 0 ? 
                          technician.specialties.map((specialty: string, index: number) => (
                            <span 
                              key={index}
                              className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                            >
                              {specialty}
                            </span>
                          )) : 
                          <span className="text-gray-500">No se han especificado especialidades</span>
                        }
                      </div>
                    </dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-sm font-medium text-gray-500">Áreas de servicio</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      <div className="flex flex-wrap gap-2">
                        {technician.serviceAreas?.length > 0 ? 
                          technician.serviceAreas.map((area: string, index: number) => (
                            <span 
                              key={index}
                              className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-gray-100 text-gray-800"
                            >
                              {area}
                            </span>
                          )) : 
                          <span className="text-gray-500">No se han especificado áreas de servicio</span>
                        }
                      </div>
                    </dd>
                  </div>
                  {technician.skills?.length > 0 && (
                    <div className="sm:col-span-2">
                      <dt className="text-sm font-medium text-gray-500">Habilidades</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        <div className="flex flex-wrap gap-2">
                          {technician.skills.map((skill: string, index: number) => (
                            <span 
                              key={index}
                              className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-green-100 text-green-800"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </dd>
                    </div>
                  )}
                  {technician.certificates?.length > 0 && (
                    <div className="sm:col-span-2">
                      <dt className="text-sm font-medium text-gray-500">Certificaciones</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        <ul className="list-disc pl-5 space-y-1">
                          {technician.certificates.map((cert: string, index: number) => (
                            <li key={index}>{cert}</li>
                          ))}
                        </ul>
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            </div>

            {/* Sección de reseñas */}
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6">
                <h2 className="text-lg leading-6 font-medium text-gray-900">Reseñas</h2>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                  Opiniones de clientes anteriores
                </p>
              </div>
              <div className="border-t border-gray-200">
                {reviews.length > 0 ? (
                  <ul className="divide-y divide-gray-200">
                    {reviews.map((review) => (
                      <li key={review.id} className="px-4 py-5 sm:px-6">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-medium text-gray-900">{review.clientName || 'Cliente'}</h3>
                          <p className="mt-1 text-sm text-gray-500">{formatDate(review.createdAt)}</p>
                        </div>
                        <div className="mt-2 flex items-center">
                          {renderStars(review.rating)}
                          <span className="ml-2 text-sm text-gray-500">{review.rating}/5</span>
                        </div>
                        {review.comment && (
                          <p className="mt-3 text-sm text-gray-700">{review.comment}</p>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="px-4 py-5 sm:px-6 text-center">
                    <p className="text-sm text-gray-500">Este técnico aún no tiene reseñas.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-8 text-center">
              <Link
                href="/technicians"
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Ver todos los técnicos
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-4 py-5 sm:p-6 text-center">
              <p className="text-gray-500">No se encontró información del técnico.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
