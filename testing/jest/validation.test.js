const { validateEmail, validatePassword, validatePhone } = require('../../src/utils/validation');

describe('Teknigo Validation Functions', () => {
  describe('validateEmail', () => {
    test('should accept valid emails with allowed domains', () => {
      const validEmails = [
        'test@example.com',
        'user@teknigo.net',
        'admin@company.org',
        'contact@site.edu',
        'info@gobierno.gov',
        'user@empresa.pe',
        'test@startup.io'
      ];
      
      validEmails.forEach(email => {
        expect(validateEmail(email)).toBe(true);
      });
    });

    test('should reject invalid emails', () => {
      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'test@',
        'test@example.xyz',
        ''
      ];
      
      invalidEmails.forEach(email => {
        expect(validateEmail(email)).toBe(false);
      });
    });
  });

  describe('validatePassword', () => {
    test('should accept strong passwords', () => {
      const strongPasswords = [
        'MyStr0ng!Pass',
        'C0mplex@Password2023',
        'Secure#123Pass'
      ];
      
      strongPasswords.forEach(password => {
        const result = validatePassword(password);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    test('should reject weak passwords', () => {
      const weakPasswords = [
        'weak',
        '12345678',
        'password',
        'Pass123'
      ];
      
      weakPasswords.forEach(password => {
        const result = validatePassword(password);
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });
  });

  describe('validatePhone', () => {
    test('should accept valid Mexican phone numbers', () => {
      const validPhones = [
        '+52 123 456 7890',
        '1234567890'
      ];
      
      validPhones.forEach(phone => {
        expect(validatePhone(phone)).toBe(true);
      });
    });
  });
});
