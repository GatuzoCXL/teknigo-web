import { firestore } from '@/firebase/config';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, increment } from 'firebase/firestore';

export type RateLimitCategory = 'api' | 'auth' | 'serviceRequest' | 'contact';

interface RateLimitConfig {
  maxAttempts: number;
  blockDuration: number; // en minutos
  resetTime: number; // tiempo para resetear contador en minutos
}

const rateLimitConfigs: Record<RateLimitCategory, RateLimitConfig> = {
  api: { maxAttempts: 100, blockDuration: 15, resetTime: 60 },
  auth: { maxAttempts: 5, blockDuration: 30, resetTime: 60 },
  serviceRequest: { maxAttempts: 10, blockDuration: 60, resetTime: 240 },
  contact: { maxAttempts: 3, blockDuration: 30, resetTime: 60 }
};

/**
 * Comprueba si una IP está bloqueada o registra un nuevo intento
 */
export async function checkRateLimit(
  identifier: string,
  category: RateLimitCategory = 'api'
): Promise<{ allowed: boolean; remainingAttempts: number; blockTimeRemaining: number }> {
  const config = rateLimitConfigs[category];
  const docId = `${category}_${identifier}`;
  
  try {
    const rateLimitRef = doc(firestore, 'rateLimits', docId);
    const rateLimitDoc = await getDoc(rateLimitRef);
    
    const now = new Date();
    
    if (rateLimitDoc.exists()) {
      const data = rateLimitDoc.data();
      const lastAttempt = data.lastAttempt?.toDate() || new Date(0);
      const blockUntil = data.blockUntil?.toDate();
      
      // Verificar si está bloqueado
      if (blockUntil && now < blockUntil) {
        return {
          allowed: false,
          remainingAttempts: 0,
          blockTimeRemaining: Math.ceil((blockUntil.getTime() - now.getTime()) / 1000)
        };
      }
      
      // Resetear contador si ha pasado el tiempo de reset
      const resetTime = new Date(lastAttempt.getTime() + (config.resetTime * 60 * 1000));
      if (now > resetTime) {
        await setDoc(rateLimitRef, {
          attempts: 1,
          lastAttempt: serverTimestamp(),
          blockUntil: null
        });
        
        return {
          allowed: true,
          remainingAttempts: config.maxAttempts - 1,
          blockTimeRemaining: 0
        };
      }
      
      // Incrementar contador
      const newAttempts = (data.attempts || 0) + 1;
      
      if (newAttempts >= config.maxAttempts) {
        // Bloquear usuario
        const blockUntil = new Date(now.getTime() + (config.blockDuration * 60 * 1000));
        
        await updateDoc(rateLimitRef, {
          attempts: increment(1),
          lastAttempt: serverTimestamp(),
          blockUntil: blockUntil
        });
        
        return {
          allowed: false,
          remainingAttempts: 0,
          blockTimeRemaining: config.blockDuration * 60
        };
      } else {
        // Incrementar contador
        await updateDoc(rateLimitRef, {
          attempts: increment(1),
          lastAttempt: serverTimestamp()
        });
        
        return {
          allowed: true,
          remainingAttempts: config.maxAttempts - newAttempts,
          blockTimeRemaining: 0
        };
      }
    } else {
      // Primera vez
      await setDoc(rateLimitRef, {
        attempts: 1,
        lastAttempt: serverTimestamp(),
        blockUntil: null
      });
      
      return {
        allowed: true,
        remainingAttempts: config.maxAttempts - 1,
        blockTimeRemaining: 0
      };
    }
  } catch (error) {
    console.error('Error in rate limiting:', error);
    // En caso de error, permitir la acción
    return {
      allowed: true,
      remainingAttempts: config.maxAttempts,
      blockTimeRemaining: 0
    };
  }
}

/**
 * Resetear límites para un identificador específico
 */
export async function resetRateLimit(identifier: string, category: RateLimitCategory = 'api'): Promise<void> {
  const docId = `${category}_${identifier}`;
  const rateLimitRef = doc(firestore, 'rateLimits', docId);
  
  try {
    await setDoc(rateLimitRef, {
      attempts: 0,
      lastAttempt: serverTimestamp(),
      blockUntil: null
    });
  } catch (error) {
    console.error('Error resetting rate limit:', error);
  }
}
