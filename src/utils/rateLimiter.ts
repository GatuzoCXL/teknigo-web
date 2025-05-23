import { collection, doc, getDoc, setDoc, updateDoc, serverTimestamp, increment } from 'firebase/firestore';
import { firestore } from '@/firebase/config';

// Definimos tipos para las diferentes categorías de rate limiting
type RateLimitCategory = 'login' | 'register' | 'serviceRequest' | 'api' | 'contactForm';

// Configuraciones para distintos tipos de rate limiting
const rateLimitConfigs = {
  login: { maxAttempts: 5, blockDuration: 15 }, // 5 intentos, 15 minutos de bloqueo
  register: { maxAttempts: 3, blockDuration: 60 }, // 3 intentos, 60 minutos de bloqueo
  serviceRequest: { maxAttempts: 10, blockDuration: 60 }, // 10 solicitudes, 60 minutos de bloqueo
  api: { maxAttempts: 100, blockDuration: 5 }, // 100 solicitudes, 5 minutos de bloqueo
  contactForm: { maxAttempts: 5, blockDuration: 60 } // 5 envíos, 60 minutos de bloqueo
};

/**
 * Comprueba si una IP está bloqueada o registra un nuevo intento
 */
export async function checkRateLimit(
  identifier: string,
  category: RateLimitCategory = 'api'
): Promise<{ allowed: boolean; remainingAttempts: number; blockTimeRemaining: number }> {
  const config = rateLimitConfigs[category];
  const rateLimitRef = doc(firestore, 'rateLimits', `${category}_${identifier}`);

  try {
    const rateLimitDoc = await getDoc(rateLimitRef);
    const now = new Date();
    
    // Si no hay registro previo, crear uno nuevo
    if (!rateLimitDoc.exists()) {
      await setDoc(rateLimitRef, {
        attempts: 1,
        firstAttempt: serverTimestamp(),
        lastAttempt: serverTimestamp()
      });
      return { allowed: true, remainingAttempts: config.maxAttempts - 1, blockTimeRemaining: 0 };
    }
    
    const data = rateLimitDoc.data();
    const lastAttempt = data.lastAttempt.toDate();
    const timeSinceLastAttempt = (now.getTime() - lastAttempt.getTime()) / 1000 / 60; // en minutos
    
    // Si ha pasado el tiempo de bloqueo, reiniciar contador
    if (data.attempts >= config.maxAttempts && timeSinceLastAttempt >= config.blockDuration) {
      await setDoc(rateLimitRef, {
        attempts: 1,
        firstAttempt: serverTimestamp(),
        lastAttempt: serverTimestamp()
      });
      return { allowed: true, remainingAttempts: config.maxAttempts - 1, blockTimeRemaining: 0 };
    }
    
    // Si está bloqueado
    if (data.attempts >= config.maxAttempts) {
      const blockTimeRemaining = Math.ceil(config.blockDuration - timeSinceLastAttempt);
      return { allowed: false, remainingAttempts: 0, blockTimeRemaining };
    }
    
    // Incrementar intentos
    await updateDoc(rateLimitRef, {
      attempts: increment(1),
      lastAttempt: serverTimestamp()
    });
    
    return { 
      allowed: true, 
      remainingAttempts: config.maxAttempts - (data.attempts + 1),
      blockTimeRemaining: 0 
    };
    
  } catch (error) {
    console.error('Rate limit check error:', error);
    // En caso de error permitimos el acceso pero logueamos
    return { allowed: true, remainingAttempts: 1, blockTimeRemaining: 0 };
  }
}
