'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { firestore, auth } from '@/firebase/config';
import Link from 'next/link';
import ReviewForm from '@/components/reviews/ReviewForm';
import { sanitizeServiceData } from '@/utils/dataSanitizer'; 

export default function ServiceDetail() {
  const params = useParams();
  const router = useRouter();
  const serviceId = params.id as string;
  
  const [service, setService] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userType, setUserType] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [hasReview, setHasReview] = useState(false);
  const [review, setReview] = useState<any>(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  
  // Verificación de autenticación
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setUserId(user.uid);
        
        try {
          // Obtener tipo de usuario
          const userDoc = await getDoc(doc(firestore, 'users', user.uid));
          if (userDoc.exists()) {
            setUserType(userDoc.data().userType);
          }
        } catch (error) {
          console.error('Error fetching user type:', error);
        }
      } else {
        router.push('/login');
      }
      setAuthChecked(true);
    });
    
    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    const fetchServiceDetails = async () => {
      if (!serviceId) return;
      
      try {
        const serviceDoc = await getDoc(doc(firestore, 'services', serviceId));
        
        if (!serviceDoc.exists()) {
          setError('El servicio no existe o ha sido eliminado');
          return;
        }
        
        const serviceData = serviceDoc.data();
        
        // Determina si el usuario actual es propietario del servicio
        const isOwner = userId && (
          userId === serviceData.clientId || 
          userId === serviceData.technicianId
        );
        
        // Sanitizar los datos según el rol
        let processedData = serviceData;
        try {
          processedData = sanitizeServiceData(serviceData, userType, isOwner);
        } catch (err) {
          console.warn('Error al sanitizar datos:', err);
        }
        
        setService({
          id: serviceDoc.id,
          ...processedData,
          createdAtFormatted: serviceData.createdAt 
            ? new Date(serviceData.createdAt.toDate()).toLocaleString() 
            : 'Fecha desconocida',
          updatedAtFormatted: serviceData.updatedAt 
            ? new Date(serviceData.updatedAt.toDate()).toLocaleString() 
            : null
        });
        
        // Comprobar si el servicio ya tiene una reseña
        setHasReview(!!serviceData.hasReview);
        
        // Si tiene reseña, buscar la reseña
        if (serviceData.hasReview && serviceData.reviewId) {
          const reviewDoc = await getDoc(doc(firestore, 'reviews', serviceData.reviewId));
          if (reviewDoc.exists()) {
            setReview({
              id: reviewDoc.id,
              ...reviewDoc.data(),
              createdAtFormatted: reviewDoc.data().createdAt 
                ? new Date(reviewDoc.data().createdAt.toDate()).toLocaleString() 
                : null
            });
          }
        }
        
      } catch (err) {
        console.error('Error fetching service details:', err);
        setError('Error al cargar los detalles del servicio');
      } finally {
        setLoading(false);
      }
    };
    
    if (userId && serviceId) {
      fetchServiceDetails();
    }
  }, [serviceId, userId, userType]);
  
  const updateServiceStatus = async (newStatus: string) => {
    if (!service || !userId) return;
    
    setUpdating(true);
    
    try {
      // Verificar permisos
      const canUpdateStatus = 
        (userType === 'admin') || 
        (userType === 'technician' && service.technicianId === userId) ||
        (userType === 'client' && service.clientId === userId);
      
      if (!canUpdateStatus) {
        throw new Error('No tienes permiso para actualizar este servicio');
      }
      
      // Validar transiciones de estado permitidas
      if (
        (service.status === 'completed' || service.status === 'cancelled') &&
        userType !== 'admin'
      ) {
        throw new Error('No se puede modificar un servicio completado o cancelado');
      }
      
      // Actualizar en Firestore
      await updateDoc(doc(firestore, 'services', serviceId), {
        status: newStatus,
        updatedAt: new Date()
      });
      
      // Actualizar en el estado local
      setService({
        ...service,
        status: newStatus,
        updatedAt: new Date(),
        updatedAtFormatted: new Date().toLocaleString()
      });
      
    } catch (err: any) {
      console.error('Error updating service status:', err);
      setError(`Error: ${err.message}`);
    } finally {
      setUpdating(false);
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
  
  const canStartService = () => {
    if (!service || !userId || !userType) return false;
    
    return (
      service.status === 'accepted' &&
      userType === 'technician' &&
      service.technicianId === userId
    );
  };
  
  const canCompleteService = () => {
    if (!service || !userId || !userType) return false;
    
    return (
      service.status === 'in_progress' &&
      userType === 'technician' &&
      service.technicianId === userId
    );
  };
  
  const canCancelService = () => {
    if (!service || !userId || !userType) return false;
    
    // Solo los clientes y admin pueden cancelar, y solo si no está completado o cancelado
    return (
      service.status !== 'completed' &&
      service.status !== 'cancelled' &&
      (
        userType === 'admin' ||
        (userType === 'client' && service.clientId === userId)
      )
    );
  };

  const handleReviewSubmitted = () => {
    setHasReview(true);
    setShowReviewForm(false);
    // Recargar la página para mostrar la reseña
    window.location.reload();
  };

  // Función para mostrar reseña ya existente
  const renderExistingReview = () => {
    if (!review) return null;
    
    return (
      <div className="bg-white shadow sm:rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6 bg-gray-50">
          <h3 className="text-lg font-medium text-gray-900">Tu reseña</h3>
          <p className="mt-1 text-sm text-gray-500">
            Enviada el {review.createdAtFormatted}
          </p>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
          <div className="flex items-center mb-3">
            {[1, 2, 3, 4, 5].map((star) => (
              <svg 
                key={star}
                className={`w-5 h-5 ${star <= review.rating ? 'text-yellow-400' : 'text-gray-300'}`} 
                fill="currentColor" 
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.799-2.034c-.784-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
            <span className="ml-2 text-sm font-medium text-gray-700">
              {review.rating} de 5 estrellas
            </span>
          </div>
          {review.comment && (
            <p className="text-gray-700">{review.comment}</p>
          )}
        </div>
      </div>
    );
  };

  // No renderizar nada hasta que se verifique la autenticación
  if (!authChecked) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold leading-tight text-gray-900">
                Detalles del Servicio
              </h1>
            </div>
            <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
              <Link
                href="/dashboard"
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Volver al Dashboard
              </Link>
              
              {userType === 'technician' && (
                <Link
                  href="/technician/requests"
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Ver solicitudes
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {loading ? (
          <div className="flex justify-center items-center py-12">
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
                <Link href="/dashboard" className="mt-2 text-sm font-medium text-red-700 hover:text-red-600">
                  Volver al Dashboard
                </Link>
              </div>
            </div>
          </div>
        ) : service ? (
          <div className="space-y-6">
            {/* Resumen del Servicio */}
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                <div>
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    {service.serviceType || 'Servicio General'}
                  </h3>
                  <p className="mt-1 max-w-2xl text-sm text-gray-500">
                    Creado el {service.createdAtFormatted}
                  </p>
                </div>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeClass(service.status)}`}>
                  {getStatusText(service.status)}
                </span>
              </div>
              <div className="border-t border-gray-200">
                <dl>
                  {/* Descripción */}
                  <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">
                      Descripción
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {service.description || 'Sin descripción'}
                    </dd>
                  </div>
                  
                  {/* Área de servicio */}
                  <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">
                      Área/Zona
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {service.serviceArea || 'No especificada'}
                    </dd>
                  </div>
                  
                  {/* Información de contacto */}
                  <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">
                      {userType === 'client' ? 'Técnico asignado' : 'Cliente'}
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {userType === 'client' 
                        ? (service.technicianName || 'Pendiente de asignar') 
                        : (service.clientName || 'Cliente')}
                    </dd>
                  </div>
                  
                  {/* Urgencia */}
                  {service.urgent !== undefined && (
                    <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">
                        Urgencia
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                        {service.urgent 
                          ? <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">Urgente</span> 
                          : 'Normal'}
                      </dd>
                    </div>
                  )}
                  
                  {/* Fecha preferida */}
                  {service.preferredDate && (
                    <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">
                        Fecha preferida
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                        {new Date(service.preferredDate).toLocaleDateString()}
                        {service.preferredTime && (
                          <span className="ml-2">
                            ({service.preferredTime === 'morning' 
                              ? 'Mañana (8am-12pm)' 
                              : service.preferredTime === 'afternoon' 
                                ? 'Tarde (12pm-6pm)' 
                                : 'Noche (6pm-10pm)'})
                          </span>
                        )}
                      </dd>
                    </div>
                  )}
                  
                  {/* Presupuesto */}
                  {service.budget && (
                    <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">
                        Presupuesto estimado
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                        ${typeof service.budget === 'number' ? service.budget.toFixed(2) : service.budget} PEN
                      </dd>
                    </div>
                  )}
                  
                  {/* Ubicación */}
                  {service.location && (
                    <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">
                        Dirección
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                        {service.location}
                      </dd>
                    </div>
                  )}
                  
                  {/* Notas adicionales */}
                  {service.additionalNotes && (
                    <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">
                        Notas adicionales
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                        {service.additionalNotes}
                      </dd>
                    </div>
                  )}
                  
                  {/* Última actualización */}
                  {service.updatedAtFormatted && service.updatedAtFormatted !== service.createdAtFormatted && (
                    <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">
                        Última actualización
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                        {service.updatedAtFormatted}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            </div>
            
            {/* Botones de acción según el estado del servicio */}
            {(canStartService() || canCompleteService() || canCancelService()) && (
              <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Acciones disponibles
                  </h3>
                </div>
                <div className="px-4 py-5 sm:p-6 flex flex-wrap gap-3">
                  {canStartService() && (
                    <button
                      onClick={() => updateServiceStatus('in_progress')}
                      disabled={updating}
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      {updating ? 'Actualizando...' : 'Iniciar servicio'}
                    </button>
                  )}
                  
                  {canCompleteService() && (
                    <button
                      onClick={() => updateServiceStatus('completed')}
                      disabled={updating}
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                    >
                      {updating ? 'Actualizando...' : 'Completar servicio'}
                    </button>
                  )}
                  
                  {canCancelService() && (
                    <button
                      onClick={() => updateServiceStatus('cancelled')}
                      disabled={updating}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                    >
                      {updating ? 'Actualizando...' : 'Cancelar servicio'}
                    </button>
                  )}
                </div>
              </div>
            )}
            
            {/* Sección de reseñas - mostrar el formulario si el servicio está completado y es el cliente */}
            {service && service.status === 'completed' && userId === service.clientId && !hasReview && (
              <div className="mt-6">
                <ReviewForm 
                  serviceId={service.id}
                  technicianId={service.technicianId}
                  clientId={userId}
                  clientName={service.clientName || 'Cliente'}
                  onReviewSubmitted={handleReviewSubmitted}
                />
              </div>
            )}

            {/* Si ya existe una reseña, mostrarla */}
            {hasReview && review && (
              <div className="mt-6">
                {renderExistingReview()}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">No se encontró información del servicio.</p>
            <Link href="/dashboard" className="mt-4 text-blue-600 hover:text-blue-800">
              Volver al Dashboard
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}