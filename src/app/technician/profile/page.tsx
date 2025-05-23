'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { firestore, storage, auth } from '@/firebase/config';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Link from 'next/link';
import Image from 'next/image';

export default function TechnicianProfile() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const [profile, setProfile] = useState({
    displayName: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    bio: '',
    specialties: [] as string[],
    serviceAreas: [] as string[],
    hourlyRate: 0,
    yearsExperience: 0,
    availableHours: {
      morning: false,
      afternoon: false,
      evening: false,
      weekends: false
    },
    certificates: [] as string[],
    skills: [] as string[]
  });
  
  // Opciones para especialidades
  const specialtyOptions = [
    'Electricidad', 'Plomería', 'Albañilería', 'Carpintería', 
    'Pintura', 'Jardinería', 'Cerrajería', 'Limpieza', 
    'Computación', 'Electrodomésticos', 'Aire acondicionado',
    'Mudanzas', 'Instalaciones', 'Remodelaciones'
  ];
  
  // Opciones para áreas de servicio
  const serviceAreaOptions = [
    'Centro', 'Norte', 'Sur', 'Este', 'Oeste',
    'Zona Metropolitana', 'Todo el municipio', 'Fuera de la ciudad'
  ];

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          router.push('/login');
          return;
        }
        
        const userDoc = await getDoc(doc(firestore, 'users', user.uid));
        if (!userDoc.exists()) {
          setError('No se encontró el perfil. Por favor, contacta a soporte.');
          return;
        }
        
        const userData = userDoc.data();
        
        // Verificar si el usuario es técnico
        if (userData.userType !== 'technician') {
          router.push('/unauthorized');
          return;
        }
        
        // Inicializar el perfil con los datos existentes
        setProfile({
          displayName: userData.displayName || '',
          phone: userData.phone || '',
          email: user.email || '',
          address: userData.address || '',
          city: userData.city || '',
          bio: userData.bio || '',
          specialties: userData.specialties || [],
          serviceAreas: userData.serviceAreas || [],
          hourlyRate: userData.hourlyRate || 0,
          yearsExperience: userData.yearsExperience || 0,
          availableHours: userData.availableHours || {
            morning: false,
            afternoon: false,
            evening: false,
            weekends: false
          },
          certificates: userData.certificates || [],
          skills: userData.skills || []
        });
        
        // Establecer la vista previa de la imagen
        if (userData.photoURL) {
          setImagePreview(userData.photoURL);
        } else if (user.photoURL) {
          setImagePreview(user.photoURL);
        }
        
      } catch (error) {
        console.error('Error fetching technician profile:', error);
        setError('Error al cargar el perfil. Por favor, inténtalo de nuevo más tarde.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfile();
  }, [router]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('No hay usuario autenticado');
      }
      
      // Preparar datos para actualizar
      const updatedProfile = {
        ...profile,
        updatedAt: new Date()
      };
      
      // Subir imagen si hay una nueva
      if (profileImage) {
        const storageRef = ref(storage, `profile_images/${user.uid}`);
        await uploadBytes(storageRef, profileImage);
        const photoURL = await getDownloadURL(storageRef);
        updatedProfile.photoURL = photoURL;
      }
      
      // Actualizar perfil en Firestore
      await updateDoc(doc(firestore, 'users', user.uid), updatedProfile);
      
      setSuccess('Perfil actualizado correctamente');
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
      
    } catch (error: any) {
      console.error('Error updating profile:', error);
      setError(`Error al actualizar el perfil: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    // Manejar inputs de tipo número
    if (type === 'number') {
      setProfile({ ...profile, [name]: parseFloat(value) });
    } else {
      setProfile({ ...profile, [name]: value });
    }
  };
  
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    
    if (name.startsWith('availableHours.')) {
      const period = name.split('.')[1];
      setProfile({
        ...profile,
        availableHours: {
          ...profile.availableHours,
          [period]: checked
        }
      });
    }
  };
  
  const handleSpecialtyChange = (specialty: string) => {
    if (profile.specialties.includes(specialty)) {
      setProfile({
        ...profile,
        specialties: profile.specialties.filter(item => item !== specialty)
      });
    } else {
      setProfile({
        ...profile,
        specialties: [...profile.specialties, specialty]
      });
    }
  };
  
  const handleServiceAreaChange = (area: string) => {
    if (profile.serviceAreas.includes(area)) {
      setProfile({
        ...profile,
        serviceAreas: profile.serviceAreas.filter(item => item !== area)
      });
    } else {
      setProfile({
        ...profile,
        serviceAreas: [...profile.serviceAreas, area]
      });
    }
  };
  
  const handleAddSkill = () => {
    const skillInput = document.getElementById('new-skill') as HTMLInputElement;
    const skill = skillInput.value.trim();
    
    if (skill && !profile.skills.includes(skill)) {
      setProfile({
        ...profile,
        skills: [...profile.skills, skill]
      });
      skillInput.value = '';
    }
  };
  
  const handleRemoveSkill = (skill: string) => {
    setProfile({
      ...profile,
      skills: profile.skills.filter(s => s !== skill)
    });
  };
  
  const handleAddCertificate = () => {
    const certInput = document.getElementById('new-certificate') as HTMLInputElement;
    const certificate = certInput.value.trim();
    
    if (certificate && !profile.certificates.includes(certificate)) {
      setProfile({
        ...profile,
        certificates: [...profile.certificates, certificate]
      });
      certInput.value = '';
    }
  };
  
  const handleRemoveCertificate = (cert: string) => {
    setProfile({
      ...profile,
      certificates: profile.certificates.filter(c => c !== cert)
    });
  };
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProfileImage(file);
      
      // Crear vista previa
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <ProtectedRoute technicianAllowed={true}>
      <div className="min-h-screen bg-gray-100 py-12">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          {/* Header/título */}
          <div className="bg-white py-6 px-4 shadow sm:rounded-lg sm:px-6 mb-6">
            <div className="flex items-center justify-between flex-wrap">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Mi Perfil de Técnico
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  Mantén tu perfil actualizado para recibir más oportunidades de trabajo
                </p>
              </div>
              <Link 
                href="/dashboard"
                className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
              >
                Volver al Dashboard
              </Link>
            </div>
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
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
            <form onSubmit={handleSubmit} className="space-y-6">
              {success && (
                <div className="bg-green-50 border-l-4 border-green-400 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-green-700">{success}</p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Sección de Información Personal */}
              <div className="bg-white shadow sm:rounded-lg overflow-hidden">
                <div className="px-4 py-5 sm:px-6 bg-gray-50">
                  <h3 className="text-lg font-medium leading-6 text-gray-900">
                    Información Personal
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Esta información será visible para los clientes
                  </p>
                </div>
                <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
                  <div className="grid grid-cols-1 gap-y-6 sm:grid-cols-6 gap-x-6">
                    {/* Foto de perfil */}
                    <div className="sm:col-span-6">
                      <label className="block text-sm font-medium text-gray-700">Foto de perfil</label>
                      <div className="mt-2 flex items-center">
                        {imagePreview ? (
                          <div className="relative inline-block">
                            <img 
                              src={imagePreview} 
                              alt="Foto de perfil" 
                              className="h-24 w-24 rounded-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="h-24 w-24 rounded-full bg-gray-200 flex items-center justify-center text-gray-400">
                            <svg className="h-12 w-12" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                        <div className="ml-5 flex flex-col">
                          <label htmlFor="photo-upload" className="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 inline-block text-center">
                            Cambiar foto
                          </label>
                          <input
                            id="photo-upload"
                            name="photo-upload"
                            type="file"
                            className="sr-only"
                            accept="image/*"
                            onChange={handleImageChange}
                          />
                          <p className="mt-4 text-xs text-gray-500">JPG, PNG o GIF. Máximo 2MB.</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Nombre completo */}
                    <div className="sm:col-span-3">
                      <label htmlFor="displayName" className="block text-sm font-medium text-gray-700">
                        Nombre completo
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          name="displayName"
                          id="displayName"
                          value={profile.displayName}
                          onChange={handleChange}
                          className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          required
                        />
                      </div>
                    </div>
                    
                    {/* Email */}
                    <div className="sm:col-span-3">
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                        Correo electrónico
                      </label>
                      <div className="mt-1">
                        <input
                          type="email"
                          name="email"
                          id="email"
                          value={profile.email}
                          disabled
                          className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md bg-gray-50 cursor-not-allowed"
                        />
                        <p className="text-xs text-gray-500 mt-1">Para cambiar tu email, ve a la configuración de la cuenta</p>
                      </div>
                    </div>
                    
                    {/* Teléfono */}
                    <div className="sm:col-span-3">
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                        Teléfono
                      </label>
                      <div className="mt-1">
                        <input
                          type="tel"
                          name="phone"
                          id="phone"
                          value={profile.phone}
                          onChange={handleChange}
                          className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          required
                        />
                      </div>
                    </div>
                    
                    {/* Dirección */}
                    <div className="sm:col-span-6">
                      <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                        Dirección
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          name="address"
                          id="address"
                          value={profile.address}
                          onChange={handleChange}
                          className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>
                    </div>
                    
                    {/* Ciudad */}
                    <div className="sm:col-span-3">
                      <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                        Ciudad
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          name="city"
                          id="city"
                          value={profile.city}
                          onChange={handleChange}
                          className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          required
                        />
                      </div>
                    </div>
                    
                    {/* Biografía */}
                    <div className="sm:col-span-6">
                      <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
                        Biografía / Descripción
                      </label>
                      <div className="mt-1">
                        <textarea
                          id="bio"
                          name="bio"
                          rows={4}
                          value={profile.bio}
                          onChange={handleChange}
                          className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          placeholder="Cuéntanos sobre ti y tu experiencia..."
                        ></textarea>
                      </div>
                      <p className="mt-2 text-sm text-gray-500">
                        Breve descripción para tu perfil público. Máximo 500 caracteres.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Sección de Profesionalidad */}
              <div className="bg-white shadow sm:rounded-lg overflow-hidden">
                <div className="px-4 py-5 sm:px-6 bg-gray-50">
                  <h3 className="text-lg font-medium leading-6 text-gray-900">
                    Información Profesional
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Datos sobre tus servicios y especialidades
                  </p>
                </div>
                <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
                  <div className="grid grid-cols-1 gap-y-6 sm:grid-cols-6 gap-x-6">
                    {/* Tarifa por hora */}
                    <div className="sm:col-span-2">
                      <label htmlFor="hourlyRate" className="block text-sm font-medium text-gray-700">
                        Tarifa por hora (PEN)
                      </label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-500 sm:text-sm">$</span>
                        </div>
                        <input
                          type="number"
                          name="hourlyRate"
                          id="hourlyRate"
                          min="0"
                          step="10"
                          value={profile.hourlyRate}
                          onChange={handleChange}
                          className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
                          placeholder="0.00"
                          required
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                          <span className="text-gray-500 sm:text-sm">PEN</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Años de experiencia */}
                    <div className="sm:col-span-2">
                      <label htmlFor="yearsExperience" className="block text-sm font-medium text-gray-700">
                        Años de experiencia
                      </label>
                      <div className="mt-1">
                        <input
                          type="number"
                          name="yearsExperience"
                          id="yearsExperience"
                          min="0"
                          value={profile.yearsExperience}
                          onChange={handleChange}
                          className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          required
                        />
                      </div>
                    </div>
                    
                    {/* Especialidades */}
                    <div className="sm:col-span-6">
                      <fieldset>
                        <legend className="text-base font-medium text-gray-700">Especialidades</legend>
                        <div className="mt-2 space-y-2">
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                            {specialtyOptions.map((specialty) => (
                              <div key={specialty} className="relative flex items-start">
                                <div className="flex items-center h-5">
                                  <input
                                    id={`specialty-${specialty}`}
                                    name={`specialty-${specialty}`}
                                    type="checkbox"
                                    checked={profile.specialties.includes(specialty)}
                                    onChange={() => handleSpecialtyChange(specialty)}
                                    className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                                  />
                                </div>
                                <div className="ml-3 text-sm">
                                  <label htmlFor={`specialty-${specialty}`} className="font-medium text-gray-700">
                                    {specialty}
                                  </label>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                        <p className="mt-2 text-sm text-gray-500">
                          Selecciona todas las especialidades en las que ofreces servicios.
                        </p>
                      </fieldset>
                    </div>
                    
                    {/* Áreas de servicio */}
                    <div className="sm:col-span-6">
                      <fieldset>
                        <legend className="text-base font-medium text-gray-700">Áreas de servicio</legend>
                        <div className="mt-2">
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                            {serviceAreaOptions.map((area) => (
                              <div key={area} className="relative flex items-start">
                                <div className="flex items-center h-5">
                                  <input
                                    id={`area-${area}`}
                                    name={`area-${area}`}
                                    type="checkbox"
                                    checked={profile.serviceAreas.includes(area)}
                                    onChange={() => handleServiceAreaChange(area)}
                                    className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                                  />
                                </div>
                                <div className="ml-3 text-sm">
                                  <label htmlFor={`area-${area}`} className="font-medium text-gray-700">
                                    {area}
                                  </label>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                        <p className="mt-2 text-sm text-gray-500">
                          Selecciona las zonas donde puedes prestar servicios.
                        </p>
                      </fieldset>
                    </div>
                    
                    {/* Disponibilidad */}
                    <div className="sm:col-span-6">
                      <fieldset>
                        <legend className="text-base font-medium text-gray-700">Disponibilidad</legend>
                        <div className="mt-2 space-y-2">
                          <div className="flex flex-wrap gap-4">
                            <div className="relative flex items-start">
                              <div className="flex items-center h-5">
                                <input
                                  id="availableHours.morning"
                                  name="availableHours.morning"
                                  type="checkbox"
                                  checked={profile.availableHours.morning}
                                  onChange={handleCheckboxChange}
                                  className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                                />
                              </div>
                              <div className="ml-3 text-sm">
                                <label htmlFor="availableHours.morning" className="font-medium text-gray-700">
                                  Mañanas (8am-12pm)
                                </label>
                              </div>
                            </div>
                            
                            <div className="relative flex items-start">
                              <div className="flex items-center h-5">
                                <input
                                  id="availableHours.afternoon"
                                  name="availableHours.afternoon"
                                  type="checkbox"
                                  checked={profile.availableHours.afternoon}
                                  onChange={handleCheckboxChange}
                                  className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                                />
                              </div>
                              <div className="ml-3 text-sm">
                                <label htmlFor="availableHours.afternoon" className="font-medium text-gray-700">
                                  Tardes (12pm-6pm)
                                </label>
                              </div>
                            </div>
                            
                            <div className="relative flex items-start">
                              <div className="flex items-center h-5">
                                <input
                                  id="availableHours.evening"
                                  name="availableHours.evening"
                                  type="checkbox"
                                  checked={profile.availableHours.evening}
                                  onChange={handleCheckboxChange}
                                  className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                                />
                              </div>
                              <div className="ml-3 text-sm">
                                <label htmlFor="availableHours.evening" className="font-medium text-gray-700">
                                  Noches (6pm-10pm)
                                </label>
                              </div>
                            </div>
                            
                            <div className="relative flex items-start">
                              <div className="flex items-center h-5">
                                <input
                                  id="availableHours.weekends"
                                  name="availableHours.weekends"
                                  type="checkbox"
                                  checked={profile.availableHours.weekends}
                                  onChange={handleCheckboxChange}
                                  className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                                />
                              </div>
                              <div className="ml-3 text-sm">
                                <label htmlFor="availableHours.weekends" className="font-medium text-gray-700">
                                  Fines de semana
                                </label>
                              </div>
                            </div>
                          </div>
                        </div>
                      </fieldset>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Habilidades y certificados */}
              <div className="bg-white shadow sm:rounded-lg overflow-hidden">
                <div className="px-4 py-5 sm:px-6 bg-gray-50">
                  <h3 className="text-lg font-medium leading-6 text-gray-900">
                    Habilidades y Certificaciones
                  </h3>
                </div>
                <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
                  <div className="space-y-6">
                    {/* Habilidades */}
                    <div>
                      <label htmlFor="skills" className="block text-sm font-medium text-gray-700">
                        Habilidades
                      </label>
                      <div className="mt-1 flex rounded-md shadow-sm">
                        <input
                          type="text"
                          id="new-skill"
                          className="focus:ring-blue-500 focus:border-blue-500 flex-grow block w-full min-w-0 rounded-none rounded-l-md sm:text-sm border-gray-300"
                          placeholder="Nueva habilidad"
                        />
                        <button
                          type="button"
                          onClick={handleAddSkill}
                          className="-ml-px relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-r-md text-gray-700 bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        >
                          Añadir
                        </button>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {profile.skills.map((skill, index) => (
                          <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                            {skill}
                            <button
                              type="button"
                              onClick={() => handleRemoveSkill(skill)}
                              className="ml-1.5 inline-flex text-blue-400 hover:text-blue-600 focus:outline-none"
                            >
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </span>
                        ))}
                        {profile.skills.length === 0 && (
                          <span className="text-sm text-gray-500">Agrega tus habilidades principales</span>
                        )}
                      </div>
                    </div>
                    
                    {/* Certificaciones */}
                    <div>
                      <label htmlFor="certificates" className="block text-sm font-medium text-gray-700">
                        Certificaciones
                      </label>
                      <div className="mt-1 flex rounded-md shadow-sm">
                        <input
                          type="text"
                          id="new-certificate"
                          className="focus:ring-blue-500 focus:border-blue-500 flex-grow block w-full min-w-0 rounded-none rounded-l-md sm:text-sm border-gray-300"
                          placeholder="Nueva certificación o título"
                        />
                        <button
                          type="button"
                          onClick={handleAddCertificate}
                          className="-ml-px relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-r-md text-gray-700 bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        >
                          Añadir
                        </button>
                      </div>
                      <div className="mt-2 space-y-2">
                        {profile.certificates.map((cert, index) => (
                          <div key={index} className="flex justify-between items-center bg-gray-50 px-3 py-2 rounded-md">
                            <span>{cert}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveCertificate(cert)}
                              className="text-gray-400 hover:text-gray-600 focus:outline-none"
                            >
                              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ))}
                        {profile.certificates.length === 0 && (
                          <p className="text-sm text-gray-500">Agrega tus certificaciones profesionales</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Botones de acción */}
              <div className="flex justify-end space-x-3">
                <Link
                  href="/dashboard"
                  className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancelar
                </Link>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Guardando...
                    </>
                  ) : 'Guardar Perfil'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
