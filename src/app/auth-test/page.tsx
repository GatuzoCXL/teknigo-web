'use client';

import { useState, useEffect } from 'react';
import { auth } from '@/firebase/config';
import Link from 'next/link';
import { onAuthStateChanged } from 'firebase/auth';

export default function AuthTest() {
  const [email, setEmail] = useState('test@example.com');
  const [password, setPassword] = useState('password123');
  const [user, setUser] = useState<any>(null);
  const [authStatus, setAuthStatus] = useState('No autenticado');
  const [logs, setLogs] = useState<string[]>([]);
  
  // Añadir log
  const addLog = (message: string) => {
    setLogs((prevLogs) => [`${new Date().toISOString().slice(11, 19)} - ${message}`, ...prevLogs]);
  };
  
  // Monitorear cambios de autenticación
  useEffect(() => {
    addLog('Inicializando monitor de autenticación...');
    
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        addLog(`Usuario autenticado: ${currentUser.email} (${currentUser.uid})`);
        setAuthStatus('Autenticado');
      } else {
        setUser(null);
        addLog('Usuario no autenticado');
        setAuthStatus('No autenticado');
      }
    });
    
    return () => unsubscribe();
  }, []);
  
  // Login con email y contraseña
  const handleLoginWithEmail = async () => {
    try {
      addLog(`Intentando login con email: ${email}`);
      // Importar dinámicamente para evitar errores de renderizado
      const { loginWithEmailAndPassword } = await import('@/firebase/auth');
      await loginWithEmailAndPassword(email, password);
      addLog('✅ Login exitoso');
    } catch (error: any) {
      addLog(`❌ Error en login: ${error.code || error.message}`);
    }
  };
  
  // Login con Google
  const handleGoogleLogin = async () => {
    try {
      addLog('Intentando login con Google');
      // Importar dinámicamente para evitar errores de renderizado
      const { signInWithGoogle } = await import('@/firebase/auth');
      await signInWithGoogle();
      addLog('✅ Login con Google exitoso');
    } catch (error: any) {
      addLog(`❌ Error en login con Google: ${error.code || error.message}`);
    }
  };
  
  // Logout
  const handleLogout = async () => {
    try {
      addLog('Cerrando sesión...');
      await auth.signOut();
      addLog('✅ Sesión cerrada');
    } catch (error: any) {
      addLog(`❌ Error al cerrar sesión: ${error.code || error.message}`);
    }
  };
  
  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Prueba de Autenticación</h1>
      
      <div className="mb-6">
        <div className="bg-gray-100 p-4 rounded-md mb-4">
          <div className="font-semibold mb-2">Estado:</div>
          <div className={authStatus === 'Autenticado' ? 'text-green-600' : 'text-red-600'}>
            {authStatus}
          </div>
        </div>
        
        {user && (
          <div className="bg-gray-100 p-4 rounded-md mb-4">
            <div className="font-semibold mb-2">Usuario:</div>
            <div>Email: {user.email}</div>
            <div>UID: {user.uid}</div>
            <div>Verificado: {user.emailVerified ? 'Sí' : 'No'}</div>
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="border p-4 rounded-md">
          <h2 className="font-bold mb-2">Login con Email</h2>
          <div className="mb-4">
            <label className="block text-sm mb-1">Email:</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 border rounded" 
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm mb-1">Contraseña:</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 border rounded" 
            />
          </div>
          <button 
            onClick={handleLoginWithEmail}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Iniciar sesión
          </button>
        </div>
        
        <div className="border p-4 rounded-md">
          <h2 className="font-bold mb-4">Otras acciones</h2>
          <div className="space-y-4">
            <button 
              onClick={handleGoogleLogin}
              className="bg-red-600 text-white px-4 py-2 rounded w-full"
            >
              Login con Google
            </button>
            
            <button 
              onClick={handleLogout}
              className="bg-gray-800 text-white px-4 py-2 rounded w-full"
              disabled={!user}
            >
              Cerrar sesión
            </button>
            
            <Link href="/" className="block text-center bg-green-600 text-white px-4 py-2 rounded w-full">
              Volver a Inicio
            </Link>
          </div>
        </div>
      </div>
      
      <div>
        <h2 className="font-bold mb-2">Logs:</h2>
        <div className="border p-4 rounded-md bg-gray-900 text-green-500 font-mono text-sm h-60 overflow-y-auto">
          {logs.length === 0 ? (
            <div className="text-gray-500">Sin actividad</div>
          ) : (
            logs.map((log, index) => <div key={index}>{log}</div>)
          )}
        </div>
      </div>
    </div>
  );
}
