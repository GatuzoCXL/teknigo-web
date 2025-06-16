// Dominios permitidos para correos electrónicos
const ALLOWED_EMAIL_DOMAINS = [
  'gmail.com',
  'hotmail.com',
  'outlook.com',
  'yahoo.com',
  'icloud.com',
  'protonmail.com',
  'teknigo.com',
  'teknigo.pe',
  'teknigo.mx',
  'teknigo.co',
  'teknigo.es'
];

// Requisitos de contraseña
const PASSWORD_REQUIREMENTS = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true
};

/**
 * Valida un correo electrónico
 * @param email Correo electrónico a validar
 * @returns Objeto con el resultado de la validación
 */
export function validateEmail(email: string): { isValid: boolean; message?: string } {
  // Validar formato básico
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return {
      isValid: false,
      message: 'El formato del correo electrónico no es válido'
    };
  }

  // Extraer el dominio
  const domain = email.split('@')[1].toLowerCase();

  // Verificar si el dominio está permitido
  if (!ALLOWED_EMAIL_DOMAINS.includes(domain)) {
    return {
      isValid: false,
      message: `El dominio ${domain} no está permitido. Por favor use uno de los siguientes dominios: ${ALLOWED_EMAIL_DOMAINS.join(', ')}`
    };
  }

  return { isValid: true };
}

/**
 * Valida una contraseña según los requisitos establecidos
 * @param password Contraseña a validar
 * @returns Objeto con el resultado de la validación
 */
export function validatePassword(password: string): { isValid: boolean; message?: string } {
  const errors: string[] = [];

  if (password.length < PASSWORD_REQUIREMENTS.minLength) {
    errors.push(`La contraseña debe tener al menos ${PASSWORD_REQUIREMENTS.minLength} caracteres`);
  }

  if (PASSWORD_REQUIREMENTS.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('La contraseña debe contener al menos una letra mayúscula');
  }

  if (PASSWORD_REQUIREMENTS.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('La contraseña debe contener al menos una letra minúscula');
  }

  if (PASSWORD_REQUIREMENTS.requireNumbers && !/\d/.test(password)) {
    errors.push('La contraseña debe contener al menos un número');
  }

  if (PASSWORD_REQUIREMENTS.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('La contraseña debe contener al menos un carácter especial (!@#$%^&*(),.?":{}|<>)');
  }

  if (errors.length > 0) {
    return {
      isValid: false,
      message: errors.join('. ')
    };
  }

  return { isValid: true };
}

/**
 * Obtiene los requisitos de contraseña para mostrar al usuario
 */
export function getPasswordRequirements(): string[] {
  const requirements: string[] = [
    `Mínimo ${PASSWORD_REQUIREMENTS.minLength} caracteres`,
    'Al menos una letra mayúscula',
    'Al menos una letra minúscula',
    'Al menos un número',
    'Al menos un carácter especial (!@#$%^&*(),.?":{}|<>)'
  ];
  return requirements;
}

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