'use client';

import { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { firestore } from '@/firebase/config';

export default function EmergencyMaintenanceToggle() {
  const [loading, setLoading] = useState(false);
  const [adminCode, setAdminCode] = useState('');
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  // Código de emergencia - idealmente esto debería estar en una variable de entorno
  // o configurado de forma más segura
  const EMERGENCY_CODE = 'teknigo2023';

  const handleDisableMaintenance = async () => {
    if (adminCode !== EMERGENCY_CODE) {
      setMessage({
        type: 'error',
        text: 'Código de emergencia incorrecto'
      });
      return;
    }

    setLoading(true);
    try {
      await updateDoc(doc(firestore, 'config', 'app'), {
        maintenanceMode: false
      });
      
      setMessage({
        type: 'success',
        text: 'Modo mantenimiento desactivado. Recargando...'
      });
      
      // Recargar la página después de 2 segundos
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error('Error disabling maintenance mode:', error);
      setMessage({
        type: 'error',
        text: 'Error al desactivar el modo mantenimiento'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-8 p-4 border border-gray-200 rounded-md">
      <h3 className="text-sm font-medium text-gray-900">Acceso de emergencia para administradores</h3>
      
      {message && (
        <div className={`mt-2 p-2 text-sm rounded ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message.text}
        </div>
      )}
      
      <div className="mt-3 flex space-x-2">
        <input
          type="password"
          value={adminCode}
          onChange={(e) => setAdminCode(e.target.value)}
          placeholder="Código de emergencia"
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
        <button
          onClick={handleDisableMaintenance}
          disabled={loading}
          className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
        >
          {loading ? 'Procesando...' : 'Desactivar mantenimiento'}
        </button>
      </div>
    </div>
  );
}
