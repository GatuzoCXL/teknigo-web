export const validateEmail = (email: string): boolean => {
  // Validación básica de formato
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return false;
  }
  
  // Validación de dominios válidos
  const validDomains = ['.com', '.net', '.org', '.edu', '.gov', '.pe', '.co', '.mx', '.es', '.io', '.tech'];
  const domain = email.substring(email.lastIndexOf('.'));
  return validDomains.includes(domain);
};

export const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('La contraseña debe tener al menos 8 caracteres');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('La contraseña debe contener al menos una letra mayúscula');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('La contraseña debe contener al menos una letra minúscula');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('La contraseña debe contener al menos un número');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('La contraseña debe contener al menos un carácter especial');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validatePhone = (phone: string): boolean => {
  // Formato mexicano: +52 123 456 7890 o variaciones
  const phoneRegex = /^(\+?52\s?)?(\d{3}\s?\d{3}\s?\d{4}|\d{10})$/;
  return phoneRegex.test(phone.replace(/\s+/g, ''));
};

export const validateName = (name: string): boolean => {
  // Validar que no esté vacío y tenga al menos 2 caracteres
  if (!name || name.trim().length < 2) {
    return false;
  }
  
  // Validar que solo contenga letras, espacios y acentos
  const nameRegex = /^[a-zA-ZÀ-ÿ\s]+$/;
  
  // Validar longitud máxima
  if (name.length > 50) {
    return false;
  }
  
  return nameRegex.test(name.trim());
};

// Función para sanitizar inputs
export const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>]/g, '');
};

// Validación de URL (nueva función)
export const validateURL = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Validación de código postal peruano
export const validatePostalCode = (code: string): boolean => {
  const peruPostalRegex = /^\d{5}$/;
  return peruPostalRegex.test(code);
};