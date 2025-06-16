'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { collection, addDoc, doc, getDoc, serverTimestamp } from 'firebase/firestore';
import { firestore, auth } from '@/firebase/config';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Link from 'next/link';
import { serviceRequestSchema } from '@/utils/validationSchemas';
import { yupResolver } from '@hookform/resolvers/yup';
import { useForm } from 'react-hook-form';
import { checkRateLimit } from '@/utils/rateLimiter';

type ServiceFormData = {
  title: string;
  description: string;
  address: string;
  city: string;
  serviceType: string;
  priority: string;
  serviceArea?: string;
  urgent?: boolean;
  preferredDate: Date;
  preferredTime: string;
  budget?: string;
  additionalNotes?: string;
};

export default function RequestService() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [serviceTypes, setServiceTypes] = useState<string[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  
  // Lista de áreas de servicio
  const serviceAreaOptions = [
    'Centro', 'Norte', 'Sur', 'Este', 'Oeste',
    'Zona Metropolitana', 'Todo el municipio', 'Fuera de la ciudad'
  ];
  
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
        
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Error al cargar los datos necesarios');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [router]);
  
  // Reemplazamos useAuthState con useEffect
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        setUserId(null);
      }
    });
    
    return () => unsubscribe();
  }, []);
  
  // Incorporar react-hook-form con validaciones yup
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(serviceRequestSchema),
    defaultValues: {
      title: '',
      description: '',
      address: '',
      city: '',
      serviceType: '',
      priority: '',
      serviceArea: '',
      urgent: false,
      preferredDate: new Date(),
      preferredTime: '',
      budget: '',
      additionalNotes: ''
    }
  });
  
  const onSubmit = async (data: ServiceFormData) => {
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
      
      // Preparar datos del servicio
      const { budget, ...restData } = data;
      const serviceData = {
        ...restData,
        budget: budget ? parseFloat(budget) : undefined,
        clientId: user.uid,
        clientName: userData?.displayName || 'Cliente',
        clientEmail: user.email,
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
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
              Tu solicitud de servicio ha sido creada exitosamente. Pronto un técnico se pondrá en contacto contigo.
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
                  Solicitar un Servicio
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  Complete el formulario para solicitar un servicio técnico
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
          ) : (
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
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
                  
                  {/* Descripción */}
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                      Descripción del problema o servicio requerido <span className="text-red-500">*</span>
                    </label>
                    <div className="mt-1">
                      <textarea
                        id="description"
                        rows={4}
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        placeholder="Describa detalladamente el problema o servicio que necesita..."
                        {...register('description')}
                      />
                    </div>
                    {errors.description && (
                      <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                    )}
                    <p className="mt-2 text-sm text-gray-500">
                      Sea específico para que los técnicos puedan evaluar mejor su solicitud.
                    </p>
                  </div>
                  
                  {/* Ubicación */}
                  <div>
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                      Dirección <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="address"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      placeholder="Ingrese la dirección del servicio"
                      {...register('address')}
                    />
                    {errors.address && (
                      <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>
                    )}
                  </div>

                  {/* Ciudad */}
                  <div>
                    <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                      Ciudad <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="city"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      placeholder="Ingrese la ciudad"
                      {...register('city')}
                    />
                    {errors.city && (
                      <p className="mt-1 text-sm text-red-600">{errors.city.message}</p>
                    )}
                  </div>
                  
                  {/* Área de servicio */}
                  <div>
                    <label htmlFor="serviceArea" className="block text-sm font-medium text-gray-700">
                      Área de servicio (opcional)
                    </label>
                    <input
                      type="text"
                      id="serviceArea"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      placeholder="Ej. Zona Norte, Colonia Centro, etc."
                      {...register('serviceArea')}
                    />
                  </div>
                  
                  {/* Urgencia */}
                  <div>
                    <label htmlFor="urgent" className="block text-sm font-medium text-gray-700">
                      Servicio urgente
                    </label>
                    <input
                      type="checkbox"
                      id="urgent"
                      className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      {...register('urgent')}
                    />
                  </div>
                  
                  {/* Fecha preferida */}
                  <div>
                    <label htmlFor="preferredDate" className="block text-sm font-medium text-gray-700">
                      Fecha preferida <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      id="preferredDate"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      {...register('preferredDate')}
                    />
                    {errors.preferredDate && (
                      <p className="mt-1 text-sm text-red-600">{errors.preferredDate.message}</p>
                    )}
                  </div>
                  
                  {/* Horario preferido */}
                  <div>
                    <label htmlFor="preferredTime" className="block text-sm font-medium text-gray-700">
                      Horario preferido <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="preferredTime"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      {...register('preferredTime')}
                    >
                      <option value="">Seleccione un horario</option>
                      <option value="mañana">Mañana (8:00 - 12:00)</option>
                      <option value="tarde">Tarde (12:00 - 16:00)</option>
                      <option value="noche">Noche (16:00 - 20:00)</option>
                    </select>
                    {errors.preferredTime && (
                      <p className="mt-1 text-sm text-red-600">{errors.preferredTime.message}</p>
                    )}
                  </div>
                  
                  {/* Presupuesto */}
                  <div>
                    <label htmlFor="budget" className="block text-sm font-medium text-gray-700">
                      Presupuesto estimado (opcional)
                    </label>
                    <input
                      type="text"
                      id="budget"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      placeholder="Ej. 1000"
                      {...register('budget')}
                    />
                    {errors.budget && (
                      <p className="mt-1 text-sm text-red-600">{errors.budget.message}</p>
                    )}
                  </div>
                  
                  {/* Notas adicionales */}
                  <div>
                    <label htmlFor="additionalNotes" className="block text-sm font-medium text-gray-700">
                      Notas adicionales (opcional)
                    </label>
                    <textarea
                      id="additionalNotes"
                      rows={3}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      placeholder="Información adicional que considere relevante..."
                      {...register('additionalNotes')}
                    />
                  </div>
                  
                  {/* Acciones */}
                  <div className="flex justify-end space-x-3 pt-5 border-t border-gray-200">
                    <Link
                      href="/dashboard"
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
                      ) : 'Enviar solicitud'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
