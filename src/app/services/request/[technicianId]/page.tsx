'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { collection, addDoc, doc, getDoc } from 'firebase/firestore';
import { firestore, auth } from '@/firebase/config';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Link from 'next/link';
import { serviceRequestSchema } from '@/utils/validationSchemas';
import { yupResolver } from '@hookform/resolvers/yup';
import { useForm } from 'react-hook-form';
import { checkRateLimit } from '@/utils/rateLimiter';
import { useAuthState } from 'react-firebase-hooks/auth';

export default function RequestServiceWithTechnician() {
  const params = useParams();
  const router = useRouter();
  const technicianId = params.technicianId as string;
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [technicianData, setTechnicianData] = useState<any>(null);
  const [serviceTypes, setServiceTypes] = useState<string[]>([]);
  
  // Lista de áreas de servicio
  const serviceAreaOptions = [
    'Centro', 'Norte', 'Sur', 'Este', 'Oeste',
    'Zona Metropolitana', 'Todo el municipio', 'Fuera de la ciudad'
  ];
  
  // Obtener el estado de autenticación del usuario
  const [user] = useAuthState(auth);
  
  // React Hook Form con validación Yup
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(serviceRequestSchema),
    defaultValues: {
      serviceType: '',
      description: '',
      location: '',
      serviceArea: '',
      urgent: false,
      preferredDate: '',
      preferredTime: '',
      budget: '',
      additionalNotes: ''
    }
  });
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Verificar si hay un usuario autenticado
        const user = auth.currentUser;
        if (!user) {
          router.push('/login');
          return;
        }
        
        // Obtener datos del usuario
        const userDoc = await getDoc(doc(firestore, 'users', user.uid));
        if (userDoc.exists()) {
          setUserData({
            id: user.uid,
            email: user.email,
            ...userDoc.data()
          });
        }
        
        // Obtener datos del técnico seleccionado
        const technicianDoc = await getDoc(doc(firestore, 'users', technicianId));
        if (!technicianDoc.exists()) {
          setError('El técnico seleccionado no existe');
          return;
        }
        
        const techData = technicianDoc.data();
        if (techData.userType !== 'technician') {
          setError('El usuario seleccionado no es un técnico');
          return;
        }
        
        setTechnicianData({
          id: technicianDoc.id,
          ...techData
        });
        
        // Obtener tipos de servicio desde la configuración o usar los del técnico
        if (techData.specialties && techData.specialties.length > 0) {
          setServiceTypes(techData.specialties);
        } else {
          // Obtener tipos de servicio desde la configuración
          const settingsDoc = await getDoc(doc(firestore, 'system', 'settings'));
          if (settingsDoc.exists() && settingsDoc.data().serviceTypes) {
            setServiceTypes(settingsDoc.data().serviceTypes);
          } else {
            // Tipos de servicio por defecto si no hay configuración
            setServiceTypes([
              'Electricidad', 'Plomería', 'Albañilería', 'Carpintería', 
              'Pintura', 'Jardinería', 'Cerrajería', 'Limpieza', 
              'Computación', 'Electrodomésticos', 'Aire acondicionado',
              'Mudanzas', 'Instalaciones', 'Remodelaciones'
            ]);
          }
        }
        
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Error al cargar los datos necesarios');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [technicianId, router]);
  
  const onSubmit = async (data) => {
    setSubmitting(true);
    setError(null);
    
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('No hay un usuario autenticado');
      }
      
      // Verificar rate limit usando el ID del usuario
      const rateLimitCheck = await checkRateLimit(user.uid, 'serviceRequest');
      
      if (!rateLimitCheck.allowed) {
        setError(`Has excedido el límite de solicitudes. Por favor, intenta de nuevo en ${rateLimitCheck.blockTimeRemaining} minutos.`);
        return;
      }
      
      // Crear la solicitud de servicio con el técnico pre-asignado
      const serviceData = {
        clientId: user.uid,
        clientName: userData?.displayName || 'Cliente',
        clientEmail: user.email,
        ...data, // Los datos ya están validados por yup
        // Pre-asignar el técnico
        technicianId: technicianId,
        technicianName: technicianData?.displayName || 'Técnico',
        technicianEmail: technicianData?.email || '',
        // Estado "accepted" en lugar de "pending" ya que el técnico está pre-seleccionado
        status: 'accepted',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Convertir presupuesto a número si existe
      if (serviceData.budget) {
        serviceData.budget = parseFloat(serviceData.budget);
      }
      
      // Guardar en Firestore
      const docRef = await addDoc(collection(firestore, 'services'), serviceData);
      console.log('Service request created with ID:', docRef.id);
      
      // Mostrar mensaje de éxito y redireccionar
      setSuccess(true);
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
      
    } catch (err) {
      console.error('Error creating service request:', err);
      setError('Error al crear la solicitud de servicio');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 bg-white p-6 rounded-lg shadow-md">
          <div>
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
              <svg className="h-6 w-6 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              ¡Solicitud Enviada!
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Tu solicitud de servicio ha sido asignada al técnico {technicianData?.displayName}. Te contactará pronto.
            </p>
          </div>
          <div className="mt-5 text-center">
            <Link 
              href="/dashboard" 
              className="inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              Volver al Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-100 py-12">
        <div className="max-w-3xl mx-auto sm:px-6 lg:px-8">
          {/* Header */}
          <div className="bg-white py-6 px-4 shadow sm:rounded-lg sm:px-6 mb-6">
            <div className="flex items-center justify-between flex-wrap">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Solicitar servicio con un técnico específico
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  Completa el formulario para solicitar un servicio con {technicianData?.displayName || 'el técnico seleccionado'}
                </p>
              </div>
              <Link 
                href="/dashboard"
                className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Volver
              </Link>
            </div>
          </div>
          
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
                  <Link href="/technicians" className="mt-2 text-sm font-medium text-red-700 hover:text-red-600">
                    Volver a la lista de técnicos
                  </Link>
                </div>
              </div>
            </div>
          ) : technicianData ? (
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              {/* Información del técnico seleccionado */}
              <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-12 w-12">
                    {technicianData.photoURL ? (
                      <img className="h-12 w-12 rounded-full" src={technicianData.photoURL} alt="" />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-blue-500 flex items-center justify-center">
                        <span className="text-white text-lg font-medium">
                          {technicianData.displayName?.charAt(0) || 'T'}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      {technicianData.displayName}
                    </h3>
                    <div className="flex items-center mt-1">
                      {[...Array(5)].map((_, i) => (
                        <svg 
                          key={i} 
                          className={`h-4 w-4 ${i < Math.round(technicianData.rating || 0) ? 'text-yellow-400' : 'text-gray-300'}`} 
                          fill="currentColor" 
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.799-2.034c-.784-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                      <span className="ml-1 text-sm text-gray-500">
                        {technicianData.rating ? `${technicianData.rating.toFixed(1)}/5` : 'Sin calificaciones'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Formulario de solicitud */}
              <form onSubmit={handleSubmit(onSubmit)} className="px-4 py-5 sm:p-6">
                {error && (
                  <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-red-700">{error}</p>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="space-y-6">
                  {/* Tipo de servicio */}
                  <div>
                    <label htmlFor="serviceType" className="block text-sm font-medium text-gray-700">
                      Tipo de servicio <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="serviceType"
                      {...register('serviceType')}
                      className={`mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md ${errors.serviceType ? 'border-red-500' : ''}`}
                    >
                      <option value="">Seleccione un tipo</option>
                      {serviceTypes.map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                    {errors.serviceType && (
                      <p className="mt-1 text-sm text-red-600">{errors.serviceType.message}</p>
                    )}
                  </div>
                  
                  {/* Resto del formulario igual que en la otra página de solicitud */}
                  {/* ... Aquí iría el resto de campos del formulario ... */}
                  
                  {/* Descripción */}
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                      Descripción del problema <span className="text-red-500">*</span>
                    </label>
                    <div className="mt-1">
                      <textarea
                        id="description"
                        rows={4}
                        {...register('description')}
                        className={`shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md ${errors.description ? 'border-red-500' : ''}`}
                        placeholder="Describa detalladamente el problema o servicio que necesita..."
                      />
                    </div>
                    {errors.description && (
                      <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                    )}
                  </div>
                  
                  {/* Ubicación */}
                  <div>
                    <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                      Dirección específica (opcional)
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        id="location"
                        {...register('location')}
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        placeholder="Ej. Calle Principal #123, Colonia Centro"
                      />
                    </div>
                  </div>
                  
                  {/* Área de servicio */}
                  <div>
                    <label htmlFor="serviceArea" className="block text-sm font-medium text-gray-700">
                      Área/Zona <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="serviceArea"
                      {...register('serviceArea')}
                      className={`mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md ${errors.serviceArea ? 'border-red-500' : ''}`}
                    >
                      <option value="">Seleccione una zona</option>
                      {serviceAreaOptions.map((area) => (
                        <option key={area} value={area}>{area}</option>
                      ))}
                    </select>
                    {errors.serviceArea && (
                      <p className="mt-1 text-sm text-red-600">{errors.serviceArea.message}</p>
                    )}
                  </div>
                  
                  {/* Urgente */}
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="urgent"
                        type="checkbox"
                        {...register('urgent')}
                        className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="urgent" className="font-medium text-gray-700">Servicio Urgente</label>
                      <p className="text-gray-500">Marque esta opción si necesita atención inmediata</p>
                    </div>
                  </div>
                  
                  {/* Acciones */}
                  <div className="flex justify-end space-x-3 pt-5 border-t border-gray-200">
                    <Link
                      href="/technicians"
                      className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Cancelar
                    </Link>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitting ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Enviando...
                        </>
                      ) : 'Solicitar servicio'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          ) : (
            <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6 text-center">
              <p className="text-gray-500">Cargando información del técnico...</p>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
