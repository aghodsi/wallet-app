import { createContext, useContext, useState, useCallback, useEffect } from "react";

interface TimezoneContextType {
  selectedTimezone: string;
  setTimezone: (timezone: string) => void;
  formatDateInTimezone: (date: Date | string | number, options?: Intl.DateTimeFormatOptions) => string;
  formatDateTimeInTimezone: (date: Date | string | number) => string;
  formatDateShortInTimezone: (date: Date | string | number) => string;
}

const TimezoneContext = createContext<TimezoneContextType | undefined>(undefined);

// Common timezones that users might want to select
export const COMMON_TIMEZONES = [
  { value: "UTC", label: "UTC", offset: "UTC+0" },
  { value: "America/New_York", label: "Eastern Time", offset: "UTC-5/-4" },
  { value: "America/Chicago", label: "Central Time", offset: "UTC-6/-5" },
  { value: "America/Denver", label: "Mountain Time", offset: "UTC-7/-6" },
  { value: "America/Los_Angeles", label: "Pacific Time", offset: "UTC-8/-7" },
  { value: "Europe/London", label: "London", offset: "UTC+0/+1" },
  { value: "Europe/Berlin", label: "Berlin", offset: "UTC+1/+2" },
  { value: "Europe/Paris", label: "Paris", offset: "UTC+1/+2" },
  { value: "Europe/Brussels", label: "Brussels", offset: "UTC+1/+2" },
  { value: "Europe/Zurich", label: "Zurich", offset: "UTC+1/+2" },
  { value: "Asia/Tokyo", label: "Tokyo", offset: "UTC+9" },
  { value: "Asia/Shanghai", label: "Shanghai", offset: "UTC+8" },
  { value: "Asia/Hong_Kong", label: "Hong Kong", offset: "UTC+8" },
  { value: "Asia/Singapore", label: "Singapore", offset: "UTC+8" },
  { value: "Australia/Sydney", label: "Sydney", offset: "UTC+10/+11" },
];

interface TimezoneProviderProps {
  children: React.ReactNode;
}

export function TimezoneProvider({ children }: TimezoneProviderProps) {
  // Always start with UTC on server to prevent hydration mismatches
  const [selectedTimezone, setSelectedTimezone] = useState<string>('UTC');
  const [mounted, setMounted] = useState(false);

  // Initialize timezone after component mounts (client-side only)
  useEffect(() => {
    setMounted(true);
    
    // Try to load from localStorage first, fallback to system timezone
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('wallet-app-timezone');
      if (stored) {
        setSelectedTimezone(stored);
      } else {
        // Fallback to system timezone and save it
        const systemTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        setSelectedTimezone(systemTimezone);
        localStorage.setItem('wallet-app-timezone', systemTimezone);
      }
    }
  }, []);

  // Save timezone to localStorage when it changes (but only after mount)
  useEffect(() => {
    if (mounted && typeof window !== 'undefined') {
      localStorage.setItem('wallet-app-timezone', selectedTimezone);
    }
  }, [selectedTimezone, mounted]);

  const setTimezone = useCallback((timezone: string) => {
    setSelectedTimezone(timezone);
  }, []);

  const formatDateInTimezone = useCallback((date: Date | string | number, options?: Intl.DateTimeFormatOptions): string => {
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
        timeZone: selectedTimezone,
        ...options
      };

      return dateObj.toLocaleDateString('en-US', defaultOptions);
    } catch (error) {
      console.error('Error formatting date in timezone:', error);
      return 'Invalid Date';
    }
  }, [selectedTimezone]);

  const formatDateTimeInTimezone = useCallback((date: Date | string | number): string => {
    return formatDateInTimezone(date, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, [formatDateInTimezone]);

  const formatDateShortInTimezone = useCallback((date: Date | string | number): string => {
    return formatDateInTimezone(date, {
      month: 'short',
      day: 'numeric'
    });
  }, [formatDateInTimezone]);

  const value = {
    selectedTimezone,
    setTimezone,
    formatDateInTimezone,
    formatDateTimeInTimezone,
    formatDateShortInTimezone,
  };

  return (
    <TimezoneContext.Provider value={value}>
      {children}
    </TimezoneContext.Provider>
  );
}

export function useTimezone() {
  const context = useContext(TimezoneContext);
  if (!context) {
    throw new Error("useTimezone must be used within a TimezoneProvider");
  }
  return context;
}
