'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PublicUserType } from '@/firebase/auth';

export default function CreateTestUser() {
  const [email, setEmail] = useState('test@example.com');
  const [password, setPassword] = useState('password123');
  const [name, setName] = useState('Usuario de Prueba');
  const [userType, setUserType] = useState<PublicUserType>('client');
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('Creando usuario...');
    setError(null);
    
    try {
      // Importar dinámicamente para evitar errores en SSR
      const { registerWithEmailAndPassword } = await import('@/firebase/auth');
      const createdUser = await registerWithEmailAndPassword(email, password, name, userType);
      setUser(createdUser);
      setStatus('Usuario creado exitosamente');
    } catch (error: any) {
      setError(`Error: ${error.message || 'Error desconocido'}`);
      setStatus(null);
    }
  };

  return (
    <div className="max-w-md mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Crear Usuario de Prueba</h1>
      
      <form onSubmit={handleCreateUser} className="space-y-4">
        <div>
          <label className="block text-sm mb-1">Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm mb-1">Contraseña:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm mb-1">Nombre:</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm mb-1">Tipo de Usuario:</label>
          <select
            value={userType}
            onChange={(e) => setUserType(e.target.value as PublicUserType)}
            className="w-full p-2 border rounded"
          >
            <option value="client">Cliente</option>
            <option value="technician">Técnico</option>
          </select>
        </div>
        
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 px-4 rounded"
        >
          Crear Usuario
        </button>
      </form>
      
      {status && <p className="mt-4 text-green-600">{status}</p>}
      {error && <p className="mt-4 text-red-600">{error}</p>}
      
      {user && (
        <div className="mt-6 bg-gray-100 p-4 rounded">
          <h2 className="font-bold mb-2">Usuario Creado:</h2>
          <div>UID: {user.uid}</div>
          <div>Email: {user.email}</div>
        </div>
      )}
      
      <div className="mt-8">
        <Link href="/" className="text-blue-600 hover:underline">
          Volver al inicio
        </Link>
        <span className="mx-2">|</span>
        <Link href="/auth-test" className="text-blue-600 hover:underline">
          Ir a prueba de autenticación
        </Link>
      </div>
    </div>
  );
}
