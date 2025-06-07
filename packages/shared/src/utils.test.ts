import { describe, it, expect } from 'vitest';
import { generateId, isValidEmail, createSuccessResponse, createErrorResponse } from './utils';

describe('utils', () => {
  describe('generateId', () => {
    it('should generate a valid ULID', () => {
      const id = generateId();
      expect(id).toBeDefined();
      expect(typeof id).toBe('string');
      expect(id.length).toBe(26);
    });
  });

  describe('isValidEmail', () => {
    it('should validate correct email', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
    });

    it('should reject invalid email', () => {
      expect(isValidEmail('invalid-email')).toBe(false);
    });
  });

  describe('createSuccessResponse', () => {
    it('should create success response', () => {
      const response = createSuccessResponse({ message: 'success' });
      expect(response.success).toBe(true);
      expect(response.data).toEqual({ message: 'success' });
    });
  });

  describe('createErrorResponse', () => {
    it('should create error response', () => {
      const response = createErrorResponse(400, 'ERROR_CODE', 'Error message');
      expect(response.success).toBe(false);
      expect(response.error.code).toBe('ERROR_CODE');
      expect(response.error.message).toBe('Error message');
    });
  });
});
