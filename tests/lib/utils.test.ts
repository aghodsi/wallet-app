import { cn, getRndInteger } from '../../app/lib/utils';

describe('utils', () => {
  describe('cn', () => {
    it('should merge class names correctly', () => {
      expect(cn('px-2 py-1', 'px-3')).toBe('py-1 px-3');
    });

    it('should handle conditional classes', () => {
      expect(cn('base-class', true && 'conditional-class')).toBe('base-class conditional-class');
      expect(cn('base-class', false && 'conditional-class')).toBe('base-class');
    });

    it('should handle undefined and null values', () => {
      expect(cn('base-class', undefined, null)).toBe('base-class');
    });

    it('should handle arrays', () => {
      expect(cn(['class1', 'class2'], 'class3')).toBe('class1 class2 class3');
    });

    it('should handle object notation', () => {
      expect(cn({ 'class1': true, 'class2': false, 'class3': true })).toBe('class1 class3');
    });
  });

  describe('getRndInteger', () => {
    it('should return a number within the specified range', () => {
      const min = 1;
      const max = 10;
      const result = getRndInteger(min, max);
      
      expect(result).toBeGreaterThanOrEqual(min);
      expect(result).toBeLessThan(max);
      expect(Number.isInteger(result)).toBe(true);
    });

    it('should return min when min and max are the same', () => {
      const min = 5;
      const max = 5;
      const result = getRndInteger(min, max);
      
      expect(result).toBe(min);
    });

    it('should work with negative numbers', () => {
      const min = -10;
      const max = -5;
      const result = getRndInteger(min, max);
      
      expect(result).toBeGreaterThanOrEqual(min);
      expect(result).toBeLessThan(max);
    });

    it('should work with zero', () => {
      const min = 0;
      const max = 5;
      const result = getRndInteger(min, max);
      
      expect(result).toBeGreaterThanOrEqual(min);
      expect(result).toBeLessThan(max);
    });

    it('should generate different values on multiple calls', () => {
      const min = 1;
      const max = 1000;
      const results = Array.from({ length: 10 }, () => getRndInteger(min, max));
      
      // Check that not all values are the same (very unlikely with a large range)
      const uniqueValues = new Set(results);
      expect(uniqueValues.size).toBeGreaterThan(1);
    });
  });
});
