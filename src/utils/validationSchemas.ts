import * as yup from 'yup';

// Esquema de validación para el registro de usuarios
export const registerSchema = yup.object().shape({
  displayName: yup.string()
    .required('El nombre es obligatorio')
    .min(3, 'El nombre debe tener al menos 3 caracteres'),
  email: yup.string()
    .email('Ingrese un email válido')
    .required('El email es obligatorio'),
  password: yup.string()
    .required('La contraseña es obligatoria')
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .matches(/[A-Z]/, 'La contraseña debe contener al menos una letra mayúscula')
    .matches(/[0-9]/, 'La contraseña debe contener al menos un número'),
  confirmPassword: yup.string()
    .oneOf([yup.ref('password')], 'Las contraseñas no coinciden')
    .required('Debe confirmar su contraseña'),
  userType: yup.string()
    .oneOf(['client', 'technician'], 'Tipo de usuario no válido')
    .required('El tipo de usuario es obligatorio'),
  terms: yup.boolean()
    .oneOf([true], 'Debe aceptar los términos y condiciones')
});

// Esquema para solicitudes de servicio
export const serviceRequestSchema = yup.object().shape({
  serviceType: yup.string()
    .required('El tipo de servicio es obligatorio'),
  description: yup.string()
    .required('La descripción del problema es obligatoria')
    .min(10, 'La descripción debe tener al menos 10 caracteres'),
  location: yup.string(),
  serviceArea: yup.string()
    .required('El área de servicio es obligatoria'),
  urgent: yup.boolean(),
  preferredDate: yup.date().nullable(),
  preferredTime: yup.string(),
  budget: yup.number().nullable()
    .transform((value, originalValue) => 
      originalValue === '' ? null : value)
    .positive('El presupuesto debe ser un valor positivo'),
  additionalNotes: yup.string()
});

// Esquema para reseñas
export const reviewSchema = yup.object().shape({
  rating: yup.number()
    .required('La calificación es obligatoria')
    .min(1, 'La calificación mínima es 1')
    .max(5, 'La calificación máxima es 5'),
  comment: yup.string()
    .required('El comentario es obligatorio')
    .min(5, 'El comentario debe tener al menos 5 caracteres')
});

// Esquema para inicio de sesión
export const loginSchema = yup.object().shape({
  email: yup.string()
    .email('Ingrese un email válido')
    .required('El email es obligatorio'),
  password: yup.string()
    .required('La contraseña es obligatoria')
});

// Esquema para edición de perfil
export const profileSchema = yup.object().shape({
  displayName: yup.string()
    .required('El nombre es obligatorio'),
  phone: yup.string(),
  address: yup.string(),
  city: yup.string(),
  newEmail: yup.string()
    .email('Ingrese un email válido')
    .required('El email es obligatorio'),
  currentPassword: yup.string(),
  newPassword: yup.string()
    .test('password-length', 'La nueva contraseña debe tener al menos 8 caracteres', 
      value => !value || value.length >= 8),
  confirmPassword: yup.string()
    .test('passwords-match', 'Las contraseñas no coinciden', 
      function(value) {
        return !this.parent.newPassword || value === this.parent.newPassword;
      })
});
