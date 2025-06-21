import {
  formatDate,
  formatDateTime,
  formatDateShort,
  formatDateWithTimezone,
  formatDateTimeWithTimezone,
  formatDateShortWithTimezone
} from '../../app/lib/dateUtils';

describe('dateUtils', () => {
  const testDate = new Date('2023-12-25T15:30:00Z');
  const testTimestamp = testDate.getTime();
  const testDateString = '2023-12-25T15:30:00Z';

  describe('formatDate', () => {
    it('should format Date object correctly', () => {
      const result = formatDate(testDate);
      expect(result).toMatch(/Dec 25, 2023/);
    });

    it('should format timestamp number correctly', () => {
      const result = formatDate(testTimestamp);
      expect(result).toMatch(/Dec 25, 2023/);
    });

    it('should format date string correctly', () => {
      const result = formatDate(testDateString);
      expect(result).toMatch(/Dec 25, 2023/);
    });

    it('should handle numeric string timestamps', () => {
      const result = formatDate(testTimestamp.toString());
      expect(result).toMatch(/Dec 25, 2023/);
    });

    it('should use custom options when provided', () => {
      const result = formatDate(testDate, { year: '2-digit', month: 'numeric', day: 'numeric' });
      expect(result).toMatch(/12\/25\/23/);
    });

    it('should handle invalid dates gracefully', () => {
      const result = formatDate('invalid-date');
      expect(result).toBe('Invalid Date');
    });

    it('should handle undefined input gracefully', () => {
      // @ts-ignore - Testing invalid input
      const result = formatDate(undefined);
      expect(result).toBe('Invalid Date');
    });
  });

  describe('formatDateTime', () => {
    it('should format date with time', () => {
      const result = formatDateTime(testDate);
      expect(result).toMatch(/Dec 25, 2023/);
      expect(result).toMatch(/\d{1,2}:\d{2}/); // Should contain time
    });

    it('should handle timestamp input', () => {
      const result = formatDateTime(testTimestamp);
      expect(result).toMatch(/Dec 25, 2023/);
      expect(result).toMatch(/\d{1,2}:\d{2}/);
    });
  });

  describe('formatDateShort', () => {
    it('should format date in short format', () => {
      const result = formatDateShort(testDate);
      expect(result).toMatch(/Dec 25/);
      expect(result).not.toMatch(/2023/); // Should not include year
    });
  });

  describe('formatDateWithTimezone', () => {
    it('should format date with timezone', () => {
      const result = formatDateWithTimezone(testDate, 'America/New_York');
      expect(result).toMatch(/Dec 25, 2023/);
    });

    it('should handle UTC timezone', () => {
      const result = formatDateWithTimezone(testDate, 'UTC');
      expect(result).toMatch(/Dec 25, 2023/);
    });

    it('should handle invalid timezone gracefully', () => {
      const result = formatDateWithTimezone(testDate, 'Invalid/Timezone');
      expect(result).toBe('Invalid Date');
    });

    it('should use custom options with timezone', () => {
      const result = formatDateWithTimezone(testDate, 'UTC', { 
        year: '2-digit', 
        month: 'numeric', 
        day: 'numeric' 
      });
      expect(result).toMatch(/12\/25\/23/);
    });
  });

  describe('formatDateTimeWithTimezone', () => {
    it('should format date and time with timezone', () => {
      const result = formatDateTimeWithTimezone(testDate, 'America/New_York');
      expect(result).toMatch(/Dec 25, 2023/);
      expect(result).toMatch(/\d{1,2}:\d{2}/);
    });

    it('should handle UTC timezone', () => {
      const result = formatDateTimeWithTimezone(testDate, 'UTC');
      expect(result).toMatch(/Dec 25, 2023/);
      expect(result).toMatch(/\d{1,2}:\d{2}/);
    });
  });

  describe('formatDateShortWithTimezone', () => {
    it('should format date in short format with timezone', () => {
      const result = formatDateShortWithTimezone(testDate, 'America/New_York');
      expect(result).toMatch(/Dec 25/);
      expect(result).not.toMatch(/2023/);
    });
  });

  describe('error handling', () => {
    beforeEach(() => {
      jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should log errors and return "Invalid Date" for corrupted date objects', () => {
      const invalidDate = new Date('invalid');
      const result = formatDate(invalidDate);
      expect(result).toBe('Invalid Date');
      expect(console.error).toHaveBeenCalledWith('Error formatting date:', expect.any(Error));
    });

    it('should handle null input gracefully', () => {
      // @ts-ignore - Testing invalid input
      const result = formatDate(null);
      expect(result).toBe('Invalid Date');
    });
  });

  describe('consistency across function variants', () => {
    it('should maintain consistent date part across all format functions', () => {
      const date = formatDate(testDate);
      const dateTime = formatDateTime(testDate);
      const dateWithTz = formatDateWithTimezone(testDate, 'UTC');
      const dateTimeWithTz = formatDateTimeWithTimezone(testDate, 'UTC');

      // Extract date part (everything before comma or space-time)
      const datePart = date.split(',')[0];
      expect(dateTime).toContain(datePart);
      expect(dateWithTz).toContain(datePart);
      expect(dateTimeWithTz).toContain(datePart);
    });
  });
});
