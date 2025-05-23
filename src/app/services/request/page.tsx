'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { collection, addDoc, doc, getDoc } from 'firebase/firestore';
import { firestore, auth } from '@/firebase/config';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Link from 'next/link';
import { serviceRequestSchema } from '@/utils/validationSchemas';
import { yupResolver } from '@hookform/resolvers/yup';
import { useForm } from 'react-hook-form';
import { checkRateLimit } from '@/utils/rateLimiter';

export default function RequestService() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [serviceTypes, setServiceTypes] = useState<string[]>([]);
  const [userId, setUserId] = useState<string | null>(null); // Añadimos estado para el ID de usuario
  
  const [serviceRequest, setServiceRequest] = useState({
    serviceType: '',
    description: '',
    location: '',
    serviceArea: '',
    urgent: false,
    preferredDate: '',
    preferredTime: '',
    budget: '',
    additionalNotes: ''
  });
  
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
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    if (type === 'checkbox') {
      setServiceRequest({
        ...serviceRequest,
        [name]: (e.target as HTMLInputElement).checked
      });
    } else {
      setServiceRequest({
        ...serviceRequest,
        [name]: value
      });
    }
  };
  
  // Incorporar react-hook-form con validaciones yup
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
      
      // Crear la solicitud de servicio (utiliza datos validados)
      const serviceData = {
        clientId: user.uid,
        clientName: userData?.displayName || 'Cliente',
        clientEmail: user.email,
        ...data, // Los datos ya están validados por yup
        status: 'pending',
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
                        name="description"
                        rows={4}
                        value={serviceRequest.description}
                        onChange={handleChange}
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
                    <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                      Dirección específica (opcional)
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        name="location"
                        id="location"
                        value={serviceRequest.location}
                        onChange={handleChange}
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        placeholder="Ej. Calle Principal #123, Colonia Centro"
                        {...register('location')}
                      />
                    </div>
                    <p className="mt-2 text-sm text-gray-500">
                      Esta información solo será visible para el técnico asignado.
                    </p>
                  </div>
                  
                  {/* Área de servicio */}
                  <div>
                    <label htmlFor="serviceArea" className="block text-sm font-medium text-gray-700">
                      Área/Zona <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="serviceArea"
                      name="serviceArea"
                      value={serviceRequest.serviceArea}
                      onChange={handleChange}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                      required={!serviceRequest.location}
                      {...register('serviceArea')}
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
                        name="urgent"
                        type="checkbox"
                        checked={serviceRequest.urgent}
                        onChange={handleChange}
                        className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                        {...register('urgent')}
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="urgent" className="font-medium text-gray-700">
                        Servicio Urgente
                      </label>
                      <p className="text-gray-500">
                        Marque esta opción si necesita atención inmediata o en las próximas 24 horas.
                      </p>
                    </div>
                  </div>
                  
                  {/* Fecha y hora preferida */}
                  <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                    <div className="sm:col-span-3">
                      <label htmlFor="preferredDate" className="block text-sm font-medium text-gray-700">
                        Fecha preferida (opcional)
                      </label>
                      <div className="mt-1">
                        <input
                          type="date"
                          name="preferredDate"
                          id="preferredDate"
                          min={new Date().toISOString().split('T')[0]}
                          value={serviceRequest.preferredDate}
                          onChange={handleChange}
                          className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          {...register('preferredDate')}
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-3">
                      <label htmlFor="preferredTime" className="block text-sm font-medium text-gray-700">
                        Horario preferido (opcional)
                      </label>
                      <div className="mt-1">
                        <select
                          id="preferredTime"
                          name="preferredTime"
                          value={serviceRequest.preferredTime}
                          onChange={handleChange}
                          className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          {...register('preferredTime')}
                        >
                          <option value="">Seleccione un horario</option>
                          <option value="morning">Mañana (8am - 12pm)</option>
                          <option value="afternoon">Tarde (12pm - 6pm)</option>
                          <option value="evening">Noche (6pm - 10pm)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  
                  {/* Presupuesto estimado */}
                  <div>
                    <label htmlFor="budget" className="block text-sm font-medium text-gray-700">
                      Presupuesto estimado (PEN) (opcional)
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">$</span>
                      </div>
                      <input
                        type="text"
                        name="budget"
                        id="budget"
                        value={serviceRequest.budget}
                        onChange={handleChange}
                        className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
                        placeholder="0.00"
                        aria-describedby="budget-currency"
                        {...register('budget')}
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm" id="budget-currency">
                          PEN
                        </span>
                      </div>
                    </div>
                    {errors.budget && (
                      <p className="mt-1 text-sm text-red-600">{errors.budget.message}</p>
                    )}
                  </div>
                  
                  {/* Notas adicionales */}
                  <div>
                    <label htmlFor="additionalNotes" className="block text-sm font-medium text-gray-700">
                      Notas adicionales (opcional)
                    </label>
                    <div className="mt-1">
                      <textarea
                        id="additionalNotes"
                        name="additionalNotes"
                        rows={3}
                        value={serviceRequest.additionalNotes}
                        onChange={handleChange}
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        placeholder="Información adicional que pueda ser útil para el técnico..."
                        {...register('additionalNotes')}
                      />
                    </div>
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
