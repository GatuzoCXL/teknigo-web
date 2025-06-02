/**
 * Utilidad para sanitizar datos según el rol del usuario
 * Elimina campos sensibles o innecesarios según permisos
 */

export type UserRole = 'admin' | 'technician' | 'client';

/**
 * Sanitiza datos de usuario según el rol del solicitante
 */
export function sanitizeUserData(userData: any, requestingUserRole: UserRole, isOwner: boolean = false): any {
  if (!userData) return null;
  
  const sanitizedData: any = {
    id: userData.id,
    displayName: userData.displayName,
    userType: userData.userType,
    isActive: userData.isActive,
    rating: userData.rating || 0,
    reviewCount: userData.reviewCount || 0,
    photoURL: userData.photoURL,
    city: userData.city
  };
  
  // Solo incluir datos sensibles para administradores o propietarios
  if (requestingUserRole === 'admin' || isOwner) {
    sanitizedData.email = userData.email;
    sanitizedData.phone = userData.phone;
    sanitizedData.address = userData.address;
    sanitizedData.createdAt = userData.createdAt;
    sanitizedData.lastLoginAt = userData.lastLoginAt;
  }
  
  // Datos específicos para técnicos (visibles para clientes)
  if (userData.userType === 'technician') {
    sanitizedData.specialties = userData.specialties || [];
    sanitizedData.serviceAreas = userData.serviceAreas || [];
    sanitizedData.hourlyRate = userData.hourlyRate;
    sanitizedData.yearsExperience = userData.yearsExperience;
    sanitizedData.bio = userData.bio;
    
    // Información profesional solo para admin o propietario
    if (requestingUserRole === 'admin' || isOwner) {
      sanitizedData.certificates = userData.certificates || [];
      sanitizedData.skills = userData.skills || [];
      sanitizedData.availableHours = userData.availableHours;
    }
  }
  
  return sanitizedData;
}

/**
 * Sanitiza datos de reseñas según el rol del usuario
 */
export function sanitizeReviewData(reviewData: any, requestingUserRole: UserRole, isOwner: boolean = false): any {
  if (!reviewData) return null;
  
  const sanitizedData: any = {
    id: reviewData.id,
    rating: reviewData.rating,
    comment: reviewData.comment,
    createdAt: reviewData.createdAt,
    clientName: reviewData.clientName
  };
  
  // Solo incluir IDs para administradores o propietarios
  if (requestingUserRole === 'admin' || isOwner) {
    sanitizedData.clientId = reviewData.clientId;
    sanitizedData.serviceId = reviewData.serviceId;
    sanitizedData.technicianId = reviewData.technicianId;
  }
  
  return sanitizedData;
}

/**
 * Sanitiza datos de servicios
 */
export function sanitizeServiceData(serviceData: any, requestingUserRole: UserRole, isOwner: boolean = false): any {
  if (!serviceData) return null;
  
  const sanitizedData: any = {
    id: serviceData.id,
    serviceType: serviceData.serviceType,
    description: serviceData.description,
    status: serviceData.status,
    createdAt: serviceData.createdAt,
    urgent: serviceData.urgent,
    serviceArea: serviceData.serviceArea
  };
  
  // Información completa para admin o propietarios
  if (requestingUserRole === 'admin' || isOwner) {
    sanitizedData.clientId = serviceData.clientId;
    sanitizedData.technicianId = serviceData.technicianId;
    sanitizedData.location = serviceData.location;
    sanitizedData.budget = serviceData.budget;
    sanitizedData.additionalNotes = serviceData.additionalNotes;
    sanitizedData.preferredDate = serviceData.preferredDate;
    sanitizedData.preferredTime = serviceData.preferredTime;
  }
  
  return sanitizedData;
}

/**
 * Limpia HTML y previene XSS
 */
export function sanitizeHTML(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remover < y >
    .replace(/javascript:/gi, '') // Remover javascript:
    .replace(/on\w+=/gi, '') // Remover event handlers
    .trim();
}

/**
 * Sanitiza entrada de texto general
 */
export function sanitizeText(input: string, maxLength: number = 1000): string {
  if (!input) return '';
  
  return sanitizeHTML(input)
    .substring(0, maxLength)
    .trim();
}
