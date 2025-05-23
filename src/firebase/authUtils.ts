import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from './config';

export const registerUser = async (email: string, password: string) => {
  // Validación adicional antes de enviar a Firebase
  const emailRegex = /^[^\s@]+@[^\s@]+\.(com|net|org|edu|gov|pe|co|mx|es|io|tech)$/i;
  if (!emailRegex.test(email)) {
    throw new Error("Formato de correo electrónico inválido. Por favor utilice un dominio válido.");
  }
  
  return createUserWithEmailAndPassword(auth, email, password);
};
