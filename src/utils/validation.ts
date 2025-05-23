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