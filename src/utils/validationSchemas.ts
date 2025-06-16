import * as yup from 'yup';
import { validateEmail, validatePassword, validatePhone, validateName } from './validation';

// Esquema de validación para el registro de usuarios
export const registerSchema = yup.object().shape({
  displayName: yup.string()
    .required('El nombre es obligatorio')
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(50, 'El nombre no puede exceder 50 caracteres')
    .test('valid-name', 'El nombre contiene caracteres no válidos', value => 
      value ? validateName(value) : false
    ),
  email: yup.string()
    .required('El email es obligatorio')
    .test('valid-email', 'Ingrese un email válido con un dominio permitido', value => 
      value ? validateEmail(value).isValid : false
    ),
  password: yup.string()
    .required('La contraseña es obligatoria')
    .test('password-strength', 'La contraseña no cumple los requisitos de seguridad', value => {
      if (!value) return false;
      const validation = validatePassword(value);
      return validation.isValid;
    }),
  confirmPassword: yup.string()
    .oneOf([yup.ref('password')], 'Las contraseñas no coinciden')
    .required('Debe confirmar su contraseña'),
  userType: yup.string()
    .oneOf(['client', 'technician'], 'Tipo de usuario no válido')
    .required('El tipo de usuario es obligatorio'),
  terms: yup.boolean()
    .oneOf([true], 'Debe aceptar los términos y condiciones')
});

// Esquema para inicio de sesión
export const loginSchema = yup.object().shape({
  email: yup.string()
    .required('El email es obligatorio')
    .test('valid-email', 'Ingrese un email válido', value => 
      value ? validateEmail(value).isValid : false
    ),
  password: yup.string()
    .required('La contraseña es obligatoria')
});

// Esquema para edición de perfil
export const profileSchema = yup.object().shape({
  displayName: yup.string()
    .required('El nombre es obligatorio')
    .test('valid-name', 'El nombre contiene caracteres no válidos', value => 
      value ? validateName(value) : false
    ),
  phone: yup.string()
    .test('valid-phone', 'Formato de teléfono inválido', value => 
      !value || validatePhone(value)
    ),
  address: yup.string()
    .max(100, 'La dirección no puede exceder 100 caracteres'),
  city: yup.string()
    .max(50, 'La ciudad no puede exceder 50 caracteres'),
  newEmail: yup.string()
    .required('El email es obligatorio')
    .test('valid-email', 'Ingrese un email válido con un dominio permitido', value => 
      value ? validateEmail(value).isValid : false
    ),
  currentPassword: yup.string(),
  newPassword: yup.string()
    .test('password-length', 'La nueva contraseña no cumple los requisitos de seguridad', 
      function(value) {
        if (!value) return true; // Opcional
        const validation = validatePassword(value);
        return validation.isValid;
      }),
  confirmPassword: yup.string()
    .test('passwords-match', 'Las contraseñas no coinciden', 
      function(value) {
        return !this.parent.newPassword || value === this.parent.newPassword;
      })
});

// Esquema para solicitudes de servicio
export const serviceRequestSchema = yup.object().shape({
  title: yup.string()
    .required('El título es obligatorio')
    .min(5, 'El título debe tener al menos 5 caracteres')
    .max(100, 'El título no puede exceder 100 caracteres'),
  description: yup.string()
    .required('La descripción es obligatoria')
    .min(20, 'La descripción debe tener al menos 20 caracteres')
    .max(1000, 'La descripción no puede exceder 1000 caracteres'),
  address: yup.string()
    .required('La dirección es obligatoria')
    .max(200, 'La dirección no puede exceder 200 caracteres'),
  city: yup.string()
    .required('La ciudad es obligatoria')
    .max(50, 'La ciudad no puede exceder 50 caracteres'),
  serviceType: yup.string()
    .required('El tipo de servicio es obligatorio')
    .oneOf(['reparacion', 'instalacion', 'mantenimiento', 'otro'], 'Tipo de servicio no válido'),
  priority: yup.string()
    .required('La prioridad es obligatoria')
    .oneOf(['baja', 'media', 'alta'], 'Prioridad no válida'),
  serviceArea: yup.string()
    .max(100, 'El área de servicio no puede exceder 100 caracteres'),
  urgent: yup.boolean(),
  preferredDate: yup.date()
    .required('La fecha preferida es obligatoria')
    .min(new Date(), 'La fecha debe ser futura'),
  preferredTime: yup.string()
    .required('El horario preferido es obligatorio')
    .oneOf(['mañana', 'tarde', 'noche'], 'Horario no válido'),
  budget: yup.string()
    .test('is-valid-budget', 'El presupuesto debe ser un número válido', value => {
      if (!value) return true; // Opcional
      return !isNaN(parseFloat(value));
    })
    .max(50, 'El presupuesto no puede exceder 50 caracteres'),
  additionalNotes: yup.string()
    .max(500, 'Las notas adicionales no pueden exceder 500 caracteres')
});
