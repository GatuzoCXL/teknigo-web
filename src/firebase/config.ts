import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Inicializar Firebase solo una vez
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const firestore = getFirestore(app);
const storage = getStorage(app);

export { app, auth, firestore, storage };

// Logging para verificar la configuración (solo en desarrollo)
if (process.env.NODE_ENV === 'development') {
  console.log('Firebase configurado con las siguientes variables:');
  console.log(`apiKey: ${process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? '✓ configurado' : '✗ no configurado'}`);
  console.log(`authDomain: ${process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ? '✓ configurado' : '✗ no configurado'}`);
  console.log(`projectId: ${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? '✓ configurado' : '✗ no configurado'}`);
  // No mostrar los valores completos por seguridad
}
