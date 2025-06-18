// Utility functions for consistent date formatting to prevent hydration mismatches

export function formatDate(date: Date | string | number, options?: Intl.DateTimeFormatOptions): string {
  try {
    let dateObj: Date;
    
    if (typeof date === 'string') {
      // Handle string timestamps
      const timestamp = parseInt(date);
      dateObj = isNaN(timestamp) ? new Date(date) : new Date(timestamp);
    } else if (typeof date === 'number') {
      dateObj = new Date(date);
    } else {
      dateObj = date;
    }

    // Use a consistent locale and format to prevent SSR/client mismatches
    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      ...options
    };

    return dateObj.toLocaleDateString('en-US', defaultOptions);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid Date';
  }
}

export function formatDateTime(date: Date | string | number): string {
  return formatDate(date, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function formatDateShort(date: Date | string | number): string {
  return formatDate(date, {
    month: 'short',
    day: 'numeric'
  });
}
