import { describe, it, expect } from 'vitest';
import { isValidMRN, formatVitalValue } from './validation';

describe('Validation Utilities', () => {
  describe('isValidMRN', () => {
    it('should return true for valid MRN format', () => {
      expect(isValidMRN('MRN-123456')).toBe(true);
    });

    it('should return false for invalid MRN format', () => {
      expect(isValidMRN('123456')).toBe(false);
      expect(isValidMRN('MRN-123')).toBe(false);
      expect(isValidMRN('MRN-ABCDEF')).toBe(false);
    });
  });

  describe('formatVitalValue', () => {
    it('should format numeric values with units', () => {
      expect(formatVitalValue(37.56, '°C')).toBe('37.6 °C');
      expect(formatVitalValue(98, '%')).toBe('98.0 %');
    });
  });
});
