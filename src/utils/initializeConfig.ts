import { firestore } from '@/firebase/config';
import { doc, getDoc, setDoc } from 'firebase/firestore';

/**
 * Inicializa el documento de configuración si no existe
 */
export async function initializeAppConfig() {
  try {
    // Comprobar si el documento ya existe
    const configDocRef = doc(firestore, 'config', 'app');
    const configDoc = await getDoc(configDocRef);
    
    // Si el documento no existe, crear con valores predeterminados
    if (!configDoc.exists()) {
      console.log('Creando documento de configuración inicial...');
      await setDoc(configDocRef, {
        maintenanceMode: false,
        allowRegistrations: true,
        requireEmailVerification: false,
        createdAt: new Date()
      });
      console.log('Configuración inicializada correctamente');
    }
    
    return true;
  } catch (error) {
    console.error('Error al inicializar la configuración:', error);
    return false;
  }
}
