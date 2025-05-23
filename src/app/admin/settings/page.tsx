'use client';

import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { firestore } from '@/firebase/config';
import AdminLayout from '@/components/admin/AdminLayout';
import { initializeAppConfig } from '@/utils/initializeConfig';

export default function AdminSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [settings, setSettings] = useState({
    maintenanceMode: false,
    allowRegistrations: true,
    requireEmailVerification: true
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        // Inicializar configuración si no existe
        await initializeAppConfig();
        
        // Cargar configuración
        const configDoc = await getDoc(doc(firestore, 'config', 'app'));
        if (configDoc.exists()) {
          const data = configDoc.data();
          setSettings({
            maintenanceMode: !!data.maintenanceMode,
            allowRegistrations: data.allowRegistrations !== false, // por defecto true
            requireEmailVerification: !!data.requireEmailVerification
          });
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
        setMessage({
          type: 'error',
          text: 'Error al cargar la configuración. Por favor, inténtalo de nuevo.'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      await setDoc(doc(firestore, 'config', 'app'), settings, { merge: true });
      setMessage({
        type: 'success',
        text: 'Configuración guardada correctamente.'
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage({
        type: 'error',
        text: 'Error al guardar la configuración. Por favor, inténtalo de nuevo.'
      });
    } finally {
      setSaving(false);
      // Limpiar el mensaje después de 3 segundos
      setTimeout(() => setMessage(null), 3000);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold text-gray-900">Configuración de seguridad</h1>
        
        {loading ? (
          <div className="flex justify-center py-6">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="mt-6 bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Opciones de Seguridad</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">Configuración general de seguridad de la plataforma.</p>
            </div>
            
            {message && (
              <div className={`mx-6 p-4 rounded-md ${message.type === 'success' ? 'bg-green-50' : 'bg-red-50'}`}>
                <div className="flex">
                  <div className="flex-shrink-0">
                    {message.type === 'success' ? (
                      <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    )}
                  </div>
                  <div className="ml-3">
                    <p className={`text-sm font-medium ${message.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>
                      {message.text}
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
              <div className="space-y-6">
                {/* Modo mantenimiento */}
                <div className="relative flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="maintenanceMode"
                      name="maintenanceMode"
                      type="checkbox"
                      checked={settings.maintenanceMode}
                      onChange={(e) => setSettings({...settings, maintenanceMode: e.target.checked})}
                      className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="maintenanceMode" className="font-medium text-gray-700">Modo de mantenimiento</label>
                    <p className="text-gray-500">Activa para mostrar una página de mantenimiento a los usuarios</p>
                  </div>
                </div>
                
                {/* Permitir registros */}
                <div className="relative flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="allowRegistrations"
                      name="allowRegistrations"
                      type="checkbox"
                      checked={settings.allowRegistrations}
                      onChange={(e) => setSettings({...settings, allowRegistrations: e.target.checked})}
                      className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="allowRegistrations" className="font-medium text-gray-700">Permitir nuevos registros</label>
                    <p className="text-gray-500">Desactiva para impedir que nuevos usuarios se registren</p>
                  </div>
                </div>
                
                {/* Verificación de email */}
                <div className="relative flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="requireEmailVerification"
                      name="requireEmailVerification"
                      type="checkbox"
                      checked={settings.requireEmailVerification}
                      onChange={(e) => setSettings({...settings, requireEmailVerification: e.target.checked})}
                      className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="requireEmailVerification" className="font-medium text-gray-700">Requerir verificación de email</label>
                    <p className="text-gray-500">Exige que los usuarios verifiquen su correo antes de poder usar la plataforma</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-8">
                <button
                  type="button"
                  onClick={handleSaveSettings}
                  disabled={saving}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {saving ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
