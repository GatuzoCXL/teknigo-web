/**
 * Utilidad para sanitizar datos según el rol del usuario
 * Elimina campos sensibles o innecesarios según permisos
 */

type UserRole = 'client' | 'technician' | 'admin' | null;

// Campos base y restringidos para documentos de usuario
const userFieldSets = {
  public: ['displayName', 'photoURL', 'userType', 'rating', 'reviewCount', 'specialties', 'serviceAreas'],
  client: ['email', 'phoneNumber', 'createdAt', 'lastLoginAt'],
  admin: ['uid', 'disabled', 'emailVerified', 'stripeCustomerId', 'notifications']
};

// Campos base y restringidos para documentos de servicio
const serviceFieldSets = {
  public: ['serviceType', 'status', 'createdAt', 'updatedAt', 'hasReview', 'clientName', 'technicianName'],
  owner: ['description', 'location', 'serviceArea', 'urgent', 'preferredDate', 'preferredTime', 'budget', 'additionalNotes'],
  admin: ['clientId', 'clientEmail', 'technicianId', 'technicianEmail', 'reviewId', 'paymentStatus']
};

/**
 * Sanitiza un documento de usuario según el rol que lo solicita
 */
export function sanitizeUserData(userData: any, requestingUserRole: UserRole, isOwnData: boolean = false): any {
  if (!userData) return null;
  
  // Crea un nuevo objeto para evitar mutaciones
  const sanitizedData: any = {};
  
  // Siempre incluir campos públicos
  userFieldSets.public.forEach(field => {
    if (field in userData) sanitizedData[field] = userData[field];
  });
  
  // Campos adicionales para administradores
  if (requestingUserRole === 'admin') {
    [...userFieldSets.client, ...userFieldSets.admin].forEach(field => {
      if (field in userData) sanitizedData[field] = userData[field];
    });
  }
  // Campos adicionales para el propio usuario o técnicos/clientes con acceso limitado
  else if (isOwnData || requestingUserRole === 'technician' || requestingUserRole === 'client') {
    userFieldSets.client.forEach(field => {
      if (field in userData) sanitizedData[field] = userData[field];
    });
  }
  
  return sanitizedData;
}

/**
 * Sanitiza un documento de servicio según el rol que lo solicita
 */
export function sanitizeServiceData(serviceData: any, requestingUserRole: UserRole, isOwner: boolean = false): any {
  if (!serviceData) return null;
  
  const sanitizedData: any = {};
  
  // Incluir todos los campos si es propietario o admin, para simplificar
  if (isOwner || requestingUserRole === 'admin') {
    return { ...serviceData };
  }
  
  // Para no propietarios, solo incluir campos públicos
  serviceFieldSets.public.forEach(field => {
    if (field in serviceData) sanitizedData[field] = serviceData[field];
  });
  
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
    createdAt: reviewData.createdAt
  };
  
  // Solo incluir IDs para administradores o propietarios
  if (requestingUserRole === 'admin' || isOwner) {
    sanitizedData.clientId = reviewData.clientId;
    sanitizedData.serviceId = reviewData.serviceId;
    sanitizedData.technicianId = reviewData.technicianId;
  }
  
  return sanitizedData;
}
