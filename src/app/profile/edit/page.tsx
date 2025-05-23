'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, firestore, storage } from '@/firebase/config';
import { onAuthStateChanged, updateEmail, updatePassword } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Link from 'next/link';
import Image from 'next/image';

export default function EditProfile() {
  const router = useRouter();
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    displayName: '',
    phone: '',
    address: '',
    city: '',
    newEmail: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/login');
        return;
      }
      
      try {
        const userDoc = await getDoc(doc(firestore, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = {
            ...userDoc.data(),
            email: user.email,
            uid: user.uid,
            photoURL: user.photoURL
          };
          
          setUserData(userData);
          setFormData({
            displayName: userData.displayName || '',
            phone: userData.phone || '',
            address: userData.address || '',
            city: userData.city || '',
            newEmail: user.email || '',
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
          });
          
          if (user.photoURL) {
            setImagePreview(user.photoURL);
          }
        }
      } catch (error) {
        console.error('Error al obtener datos del usuario:', error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProfileImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSaving(true);
    
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('No user logged in');
      }
      
      // Update profile data in Firestore
      const userRef = doc(firestore, 'users', user.uid);
      
      const updates: any = {
        displayName: formData.displayName,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        updatedAt: new Date()
      };
      
      // Upload profile image if selected
      if (profileImage) {
        const storageRef = ref(storage, `profile_images/${user.uid}`);
        await uploadBytes(storageRef, profileImage);
        const downloadURL = await getDownloadURL(storageRef);
        
        updates.photoURL = downloadURL;
      }
      
      await updateDoc(userRef, updates);
      
      // Update email if changed
      if (formData.newEmail !== user.email) {
        await updateEmail(user, formData.newEmail);
      }
      
      // Update password if provided
      if (formData.newPassword && formData.currentPassword) {
        if (formData.newPassword !== formData.confirmPassword) {
          throw new Error('Las contraseñas nuevas no coinciden');
        }
        
        // Reauthenticate user here (would require additional code)
        // Then update password
        await updatePassword(user, formData.newPassword);
      }
      
      setSuccess('Perfil actualizado correctamente');
      
      // Refresh user data
      const updatedUserDoc = await getDoc(userRef);
      if (updatedUserDoc.exists()) {
        setUserData({
          ...updatedUserDoc.data(),
          email: formData.newEmail || user.email,
          uid: user.uid
        });
      }
      
      // Clear sensitive fields
      setFormData({
        ...formData,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
    } catch (error: any) {
      console.error('Error updating profile:', error);
      setError(`Error: ${error.message || 'Error al actualizar el perfil'}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-100 py-12">
        <div className="max-w-3xl mx-auto sm:px-6 lg:px-8">
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-medium text-gray-900">Editar Perfil</h2>
                <p className="mt-1 text-sm text-gray-500">Actualiza tu información personal</p>
              </div>
              <Link 
                href="/dashboard" 
                className="text-sm font-medium text-blue-600 hover:text-blue-500"
              >
                Volver al Dashboard
              </Link>
            </div>
            
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <div className="border-t border-gray-200">
                <form onSubmit={handleSubmit}>
                  {error && (
                    <div className="mx-4 mt-4 bg-red-50 border-l-4 border-red-400 p-4">
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
                  
                  {success && (
                    <div className="mx-4 mt-4 bg-green-50 border-l-4 border-green-400 p-4">
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
                  
                  <dl>
                    {/* Imagen de perfil */}
                    <div className="bg-gray-50 px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">Foto de perfil</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-20 w-20 relative">
                            {imagePreview ? (
                              <Image 
                                src={imagePreview} 
                                alt="Profile preview" 
                                width={80}
                                height={80}
                                className="rounded-full object-cover h-20 w-20"
                              />
                            ) : (
                              <div className="h-20 w-20 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium text-xl uppercase">
                                {userData?.displayName?.charAt(0) || userData?.email?.charAt(0) || 'U'}
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <label htmlFor="profile-image" className="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                              Cambiar foto
                            </label>
                            <input
                              id="profile-image"
                              name="profile-image"
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleImageChange}
                            />
                            <p className="mt-3 text-xs text-gray-500">JPG, PNG o GIF. Máximo 2MB.</p>
                          </div>
                        </div>
                      </dd>
                    </div>

                    {/* Información personal */}
                    <div className="bg-white px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">Nombre completo</dt>
                      <dd className="mt-1 sm:mt-0 sm:col-span-2">
                        <input
                          type="text"
                          name="displayName"
                          id="displayName"
                          value={formData.displayName}
                          onChange={handleChange}
                          className="max-w-lg block w-full shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:max-w-xs sm:text-sm border-gray-300 rounded-md"
                        />
                      </dd>
                    </div>

                    <div className="bg-gray-50 px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">Correo electrónico</dt>
                      <dd className="mt-1 sm:mt-0 sm:col-span-2">
                        <input
                          type="email"
                          name="newEmail"
                          id="newEmail"
                          value={formData.newEmail}
                          onChange={handleChange}
                          className="max-w-lg block w-full shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:max-w-xs sm:text-sm border-gray-300 rounded-md"
                        />
                      </dd>
                    </div>

                    <div className="bg-white px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">Teléfono</dt>
                      <dd className="mt-1 sm:mt-0 sm:col-span-2">
                        <input
                          type="tel"
                          name="phone"
                          id="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          className="max-w-lg block w-full shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:max-w-xs sm:text-sm border-gray-300 rounded-md"
                        />
                      </dd>
                    </div>

                    <div className="bg-gray-50 px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">Dirección</dt>
                      <dd className="mt-1 sm:mt-0 sm:col-span-2">
                        <input
                          type="text"
                          name="address"
                          id="address"
                          value={formData.address}
                          onChange={handleChange}
                          className="max-w-lg block w-full shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:max-w-xs sm:text-sm border-gray-300 rounded-md"
                        />
                      </dd>
                    </div>

                    <div className="bg-white px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">Ciudad</dt>
                      <dd className="mt-1 sm:mt-0 sm:col-span-2">
                        <input
                          type="text"
                          name="city"
                          id="city"
                          value={formData.city}
                          onChange={handleChange}
                          className="max-w-lg block w-full shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:max-w-xs sm:text-sm border-gray-300 rounded-md"
                        />
                      </dd>
                    </div>

                    {/* Cambio de contraseña */}
                    <div className="bg-gray-50 px-4 py-6">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">Cambiar contraseña</h3>
                      <p className="mt-1 max-w-2xl text-sm text-gray-500">Deja en blanco estos campos si no deseas cambiar tu contraseña</p>
                    </div>

                    <div className="bg-white px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">Contraseña actual</dt>
                      <dd className="mt-1 sm:mt-0 sm:col-span-2">
                        <input
                          type="password"
                          name="currentPassword"
                          id="currentPassword"
                          value={formData.currentPassword}
                          onChange={handleChange}
                          className="max-w-lg block w-full shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:max-w-xs sm:text-sm border-gray-300 rounded-md"
                        />
                      </dd>
                    </div>

                    <div className="bg-gray-50 px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">Nueva contraseña</dt>
                      <dd className="mt-1 sm:mt-0 sm:col-span-2">
                        <input
                          type="password"
                          name="newPassword"
                          id="newPassword"
                          value={formData.newPassword}
                          onChange={handleChange}
                          className="max-w-lg block w-full shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:max-w-xs sm:text-sm border-gray-300 rounded-md"
                        />
                      </dd>
                    </div>

                    <div className="bg-white px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">Confirmar nueva contraseña</dt>
                      <dd className="mt-1 sm:mt-0 sm:col-span-2">
                        <input
                          type="password"
                          name="confirmPassword"
                          id="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          className="max-w-lg block w-full shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:max-w-xs sm:text-sm border-gray-300 rounded-md"
                        />
                      </dd>
                    </div>

                    {/* Botones */}
                    <div className="bg-gray-50 px-4 py-6 flex justify-end">
                      <Link 
                        href="/dashboard" 
                        className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Cancelar
                      </Link>
                      <button
                        type="submit"
                        disabled={saving}
                        className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {saving ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Guardando...
                          </>
                        ) : 'Guardar cambios'}
                      </button>
                    </div>
                  </dl>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
