import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword as firebaseSignIn,
  GoogleAuthProvider, 
  FacebookAuthProvider,
  signInWithPopup,
  signOut,
  updateProfile,
  sendPasswordResetEmail as firebaseSendPasswordResetEmail,
  User
} from 'firebase/auth';
import { auth, firestore } from './config';
import { doc, setDoc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { recordFailedLoginAttempt } from './loginSecurity';
import { validateEmail, validatePassword } from '@/utils/validation';

// Clase personalizada para errores de seguridad
export class LoginSecurityError extends Error {
  code: string;
  blockTimeRemaining: number;
  suggestPasswordReset: boolean;

  constructor(code: string, message: string, blockTimeRemaining: number, suggestPasswordReset: boolean) {
    super(message);
    this.name = "LoginSecurityError";
    this.code = code;
    this.blockTimeRemaining = blockTimeRemaining;
    this.suggestPasswordReset = suggestPasswordReset;
  }
}

// Tipos para parámetros
export type PublicUserType = 'client' | 'technician';
export type AdminUserType = 'admin';
export type UserType = PublicUserType | AdminUserType;

// Login con Email y Contraseña
export const loginWithEmailAndPassword = async (email: string, password: string) => {
  try {
    // Validar email
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      throw new Error(emailValidation.message);
    }

    // Verificar si hay bloqueo por intentos fallidos
    const securityCheck = await recordFailedLoginAttempt(email);
    if (securityCheck.isBlocked) {
      throw new LoginSecurityError(
        'auth/too-many-requests',
        `Cuenta temporalmente bloqueada por múltiples intentos fallidos.`,
        securityCheck.blockTimeRemaining,
        securityCheck.suggestPasswordReset
      );
    }

    const result = await firebaseSignIn(auth, email, password);
    return result.user;
  } catch (error: any) {
    // Re-lanzar el error para manejo en el nivel superior
    throw error;
  }
};

// Registro con Email y Contraseña
export const registerWithEmailAndPassword = async (
  email: string, 
  password: string, 
  displayName: string, 
  userType: PublicUserType
) => {
  try {
    // Validar email
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      throw new Error(emailValidation.message);
    }

    // Validar contraseña
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      throw new Error(passwordValidation.message);
    }

    // Crear usuario en Firebase Auth
    const result = await createUserWithEmailAndPassword(auth, email, password);
    const user = result.user;
    
    // Actualizar perfil con displayName
    await updateProfile(user, { displayName });
    
    // Crear documento en Firestore
    await setDoc(doc(firestore, 'users', user.uid), {
      uid: user.uid,
      email,
      displayName,
      userType,
      createdAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
      isActive: true,
      profileComplete: false,
      photoURL: user.photoURL,
    });
    
    return user;
  } catch (error) {
    console.error('Error registrando usuario:', error);
    throw error;
  }
};

// Login con Google - Versión actualizada con compatibilidad con popup
export const signInWithGoogle = async () => {
  try {
    // Importamos directamente para asegurar la disponibilidad de las funciones
    const provider = new GoogleAuthProvider();
    
    // Desactivar selección de cuentas para evitar problemas con popups
    provider.setCustomParameters({
      prompt: 'select_account'
    });
    
    // Intentar primero con popup para evitar problemas de redirección
    const result = await signInWithPopup(auth, provider);
    
    // Procesar resultado exitoso
    if (result && result.user) {
      // Verificar si ya existe el usuario en Firestore
      const userDoc = await getDoc(doc(firestore, 'users', result.user.uid));
      
      if (!userDoc.exists()) {
        // Crear nuevo usuario en Firestore si es la primera vez
        await setDoc(doc(firestore, 'users', result.user.uid), {
          uid: result.user.uid,
          email: result.user.email,
          displayName: result.user.displayName || 'Usuario',
          userType: 'client', // Por defecto es cliente
          createdAt: serverTimestamp(),
          lastLoginAt: serverTimestamp(),
          isActive: true,
          profileComplete: false,
          photoURL: result.user.photoURL,
        });
      } else {
        // Actualizar último acceso
        await updateDoc(doc(firestore, 'users', result.user.uid), {
          lastLoginAt: serverTimestamp(),
        });
      }
      
      return result.user;
    }
    
    throw new Error('No se pudo completar la autenticación con Google');
  } catch (error) {
    console.error('Error detallado en login con Google:', error);
    throw error;
  }
};

// Login con Facebook
export const signInWithFacebook = async () => {
  try {
    const provider = new FacebookAuthProvider();
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error) {
    console.error('Error en login con Facebook:', error);
    throw error;
  }
};

// Cerrar sesión
export const logout = async () => {
  try {
    await signOut(auth);
    return true;
  } catch (error) {
    console.error('Error al cerrar sesión:', error);
    return false;
  }
};

// Resetear contraseña
export const resetPassword = async (email: string) => {
  try {
    await firebaseSendPasswordResetEmail(auth, email);
    return true;
  } catch (error) {
    console.error('Error al enviar email de reset:', error);
    return false;
  }
};

// Obtener datos del usuario currentUser
export const getCurrentUserData = async () => {
  const user = auth.currentUser;
  
  if (!user) {
    return null;
  }
  
  try {
    const userDoc = await getDoc(doc(firestore, 'users', user.uid));
    if (userDoc.exists()) {
      return {
        ...userDoc.data(),
        id: user.uid
      };
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error al obtener datos de usuario:', error);
    return null;
  }
};
