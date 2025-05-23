import { firestore } from './config';
import { doc, getDoc, setDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from './config';

interface LoginAttempt {
  failedAttempts: number;
  lastAttemptTime: Timestamp;
  blockUntil: Timestamp | null;
  passwordResetSent: boolean;
}

const MAX_ATTEMPTS = 5; // Intentos antes del primer bloqueo
const BLOCK_DURATIONS = [
  1 * 60 * 1000,      // 1 minuto
  5 * 60 * 1000,      // 5 minutos
  15 * 60 * 1000,     // 15 minutos
  30 * 60 * 1000,     // 30 minutos
  60 * 60 * 1000,     // 1 hora
  120 * 60 * 1000,    // 2 horas
  24 * 60 * 60 * 1000 // 24 horas
];
const SUGGEST_RESET_AFTER = 7; // Intentos antes de sugerir reset
const ANONYMOUS_IP_MAX_ATTEMPTS = 10; // Máximo de intentos desde una IP sin éxito

/**
 * Formatea el tiempo de bloqueo para mostrarlo al usuario
 */
export function formatBlockTime(milliseconds: number): string {
  if (milliseconds < 60000) {
    return `${Math.ceil(milliseconds / 1000)} segundos`;
  } else if (milliseconds < 3600000) {
    return `${Math.ceil(milliseconds / 60000)} minutos`;
  } else if (milliseconds < 86400000) {
    return `${Math.ceil(milliseconds / 3600000)} horas`;
  } else {
    return `${Math.ceil(milliseconds / 86400000)} días`;
  }
}

/**
 * Registra un intento fallido de inicio de sesión para una dirección de correo específica
 */
export async function recordFailedLoginAttempt(email: string): Promise<{
  isBlocked: boolean;
  blockTimeRemaining: number;
  suggestPasswordReset: boolean;
}> {
  try {
    const normalizedEmail = email.toLowerCase().trim();
    const attemptRef = doc(firestore, 'loginAttempts', normalizedEmail);

    // Obtener intentos actuales
    const attemptDoc = await getDoc(attemptRef);
    const now = new Date();
    
    if (!attemptDoc.exists()) {
      // Primer intento fallido
      await setDoc(attemptRef, {
        failedAttempts: 1,
        lastAttemptTime: serverTimestamp(),
        blockUntil: null,
        passwordResetSent: false
      });
      return { isBlocked: false, blockTimeRemaining: 0, suggestPasswordReset: false };
    }
    
    const attemptData = attemptDoc.data() as LoginAttempt;
    
    // Comprobar si está bloqueado
    if (attemptData.blockUntil && new Date(attemptData.blockUntil.toDate()) > now) {
      const blockTimeRemaining = new Date(attemptData.blockUntil.toDate()).getTime() - now.getTime();
      return { 
        isBlocked: true, 
        blockTimeRemaining,
        suggestPasswordReset: attemptData.failedAttempts >= SUGGEST_RESET_AFTER 
      };
    }
    
    // FIX: Si existía un bloqueo pero ya expiró, reiniciar el contador de intentos
    if (attemptData.blockUntil && new Date(attemptData.blockUntil.toDate()) <= now) {
      await setDoc(attemptRef, {
        failedAttempts: 1, // Reiniciar a 1 (este intento actual)
        lastAttemptTime: serverTimestamp(),
        blockUntil: null,
        passwordResetSent: attemptData.passwordResetSent // Mantener este estado
      });
      return { isBlocked: false, blockTimeRemaining: 0, suggestPasswordReset: attemptData.passwordResetSent };
    }
    
    // Incrementar intentos
    const newAttemptCount = attemptData.failedAttempts + 1;
    
    // Determinar si se debe bloquear
    let newBlockUntil = null;
    if (newAttemptCount >= MAX_ATTEMPTS) {
      // Calcular índice para la duración del bloqueo, con límite en el último valor
      const blockIndex = Math.min(newAttemptCount - MAX_ATTEMPTS, BLOCK_DURATIONS.length - 1);
      const blockDuration = BLOCK_DURATIONS[blockIndex];
      newBlockUntil = new Date(now.getTime() + blockDuration);
    }
    
    // Actualizar documento
    await setDoc(attemptRef, {
      failedAttempts: newAttemptCount,
      lastAttemptTime: serverTimestamp(),
      blockUntil: newBlockUntil,
      passwordResetSent: attemptData.passwordResetSent || newAttemptCount >= SUGGEST_RESET_AFTER
    }, { merge: true });
    
    // Si el usuario debe ser bloqueado ahora, devolver el tiempo de bloqueo
    if (newBlockUntil) {
      const blockTimeRemaining = newBlockUntil.getTime() - now.getTime();
      return { 
        isBlocked: true, 
        blockTimeRemaining,
        suggestPasswordReset: newAttemptCount >= SUGGEST_RESET_AFTER
      };
    }
    
    return { 
      isBlocked: false, 
      blockTimeRemaining: 0,
      suggestPasswordReset: newAttemptCount >= SUGGEST_RESET_AFTER
    };
    
  } catch (error) {
    console.error('Error al registrar intento fallido:', error);
    // En caso de error, permitimos el intento de inicio de sesión
    return { isBlocked: false, blockTimeRemaining: 0, suggestPasswordReset: false };
  }
}

/**
 * Registra un intento fallido de inicio de sesión por IP
 * Usado para prevenir ataques donde se prueban múltiples correos aleatorios
 */
export async function recordFailedAnonymousAttempt(ipHash: string): Promise<{
  isBlocked: boolean;
  blockTimeRemaining: number;
}> {
  try {
    const attemptRef = doc(firestore, 'anonymousLoginAttempts', ipHash);

    // Obtener intentos actuales
    const attemptDoc = await getDoc(attemptRef);
    const now = new Date();
    
    if (!attemptDoc.exists()) {
      // Primer intento fallido
      await setDoc(attemptRef, {
        failedAttempts: 1,
        lastAttemptTime: serverTimestamp(),
        blockUntil: null
      });
      return { isBlocked: false, blockTimeRemaining: 0 };
    }
    
    const attemptData = attemptDoc.data() as Omit<LoginAttempt, 'passwordResetSent'>;
    
    // Comprobar si está bloqueado
    if (attemptData.blockUntil && new Date(attemptData.blockUntil.toDate()) > now) {
      const blockTimeRemaining = new Date(attemptData.blockUntil.toDate()).getTime() - now.getTime();
      return { 
        isBlocked: true, 
        blockTimeRemaining
      };
    }
    
    // FIX: Si existía un bloqueo pero ya expiró, reiniciar el contador
    if (attemptData.blockUntil && new Date(attemptData.blockUntil.toDate()) <= now) {
      await setDoc(attemptRef, {
        failedAttempts: 1, // Reiniciar a 1 (este intento actual)
        lastAttemptTime: serverTimestamp(),
        blockUntil: null
      });
      return { isBlocked: false, blockTimeRemaining: 0 };
    }
    
    // Incrementar intentos
    const newAttemptCount = attemptData.failedAttempts + 1;
    
    // Determinar si se debe bloquear
    let newBlockUntil = null;
    if (newAttemptCount >= ANONYMOUS_IP_MAX_ATTEMPTS) {
      // Usar duración de bloqueo más larga para intentos anónimos
      const blockIndex = Math.min(
        newAttemptCount - ANONYMOUS_IP_MAX_ATTEMPTS, 
        BLOCK_DURATIONS.length - 1
      );
      const blockDuration = BLOCK_DURATIONS[blockIndex] * 2; // Duplicamos la duración para anónimos
      newBlockUntil = new Date(now.getTime() + blockDuration);
    }
    
    // Actualizar documento
    await setDoc(attemptRef, {
      failedAttempts: newAttemptCount,
      lastAttemptTime: serverTimestamp(),
      blockUntil: newBlockUntil
    }, { merge: true });
    
    // Si el usuario debe ser bloqueado ahora, devolver el tiempo de bloqueo
    if (newBlockUntil) {
      const blockTimeRemaining = newBlockUntil.getTime() - now.getTime();
      return { 
        isBlocked: true, 
        blockTimeRemaining
      };
    }
    
    return { 
      isBlocked: false, 
      blockTimeRemaining: 0
    };
    
  } catch (error) {
    console.error('Error al registrar intento anónimo fallido:', error);
    return { isBlocked: false, blockTimeRemaining: 0 };
  }
}

/**
 * Genera un hash simple del IP para almacenarlo de forma anónima
 * No es criptográficamente seguro, pero es suficiente para este propósito
 */
export function generateSimpleHash(ip: string): string {
  let hash = 0;
  for (let i = 0; i < ip.length; i++) {
    const char = ip.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convertir a entero de 32 bits
  }
  return Math.abs(hash).toString(16);
}

/**
 * Resetea los intentos fallidos después de un inicio de sesión exitoso
 */
export async function resetLoginAttempts(email: string): Promise<void> {
  const normalizedEmail = email.toLowerCase().trim();
  const attemptRef = doc(firestore, 'loginAttempts', normalizedEmail);

  try {
    await setDoc(attemptRef, {
      failedAttempts: 0,
      lastAttemptTime: serverTimestamp(),
      blockUntil: null,
      passwordResetSent: false
    });
  } catch (error) {
    console.error('Error al resetear intentos de inicio de sesión:', error);
  }
}

/**
 * Envía un correo de restablecimiento de contraseña y registra que se envió
 */
export async function sendPasswordReset(email: string): Promise<boolean> {
  try {
    await sendPasswordResetEmail(auth, email);
    
    // Registra que se envió el correo
    const normalizedEmail = email.toLowerCase().trim();
    const attemptRef = doc(firestore, 'loginAttempts', normalizedEmail);
    
    await setDoc(attemptRef, {
      passwordResetSent: true
    }, { merge: true });
    
    return true;
  } catch (error) {
    console.error('Error al enviar correo de restablecimiento:', error);
    return false;
  }
}
