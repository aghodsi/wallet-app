/**
 * Converts a cron expression to human-readable natural language
 * @param cronExpression - Standard cron expression (5 or 6 fields)
 * @returns Human-readable description of the cron schedule
 */
/**
 * Converts recurrence settings to a cron expression
 * @param period - The recurrence period (Day, Week, Month, Quarter)
 * @param hour - The hour of the day to run (0-23)
 * @param minute - Optional minute of the hour (0-59), defaults to 0
 * @param dayOfWeek - Optional day of week for weekly recurrence (0-6, 0 is Sunday)
 * @param dayOfMonth - Optional day of month for monthly recurrence (1-31)
 * @returns A cron expression representing the recurrence pattern
 */
export function recurrenceToCron(
  period: 'Day' | 'Week' | 'Month' | 'Quarter',
  hour: number,
  minute: number = 0,
  dayOfWeek?: number,
  dayOfMonth?: number
): string {
  // Validate inputs
  hour = Math.max(0, Math.min(23, hour));
  minute = Math.max(0, Math.min(59, minute));
  
  switch (period) {
    case 'Day':
      return `${minute} ${hour} * * *`;
    case 'Week':
      return `${minute} ${hour} * * ${dayOfWeek || 0}`;
    case 'Month':
      return `${minute} ${hour} ${dayOfMonth || 1} * *`;
    case 'Quarter':
      return `${minute} ${hour} ${dayOfMonth || 1} */3 *`;
    default:
      throw new Error('Invalid recurrence period');
  }
}

export function cronToNaturalLanguage(cronExpression: string): string {
  if (!cronExpression || cronExpression.trim() === '') {
    return 'No recurrence';
  }

  const parts = cronExpression.trim().split(/\s+/);
  
  // Handle both 5-field and 6-field cron expressions
  const [minute, hour, dayOfMonth, month, dayOfWeek, year] = parts.length === 6 
    ? parts 
    : ['0', ...parts]; // Assume second=0 for 5-field expressions

  // Helper functions
  const getOrdinalSuffix = (num: number): string => {
    const j = num % 10;
    const k = num % 100;
    if (j === 1 && k !== 11) return num + 'st';
    if (j === 2 && k !== 12) return num + 'nd';
    if (j === 3 && k !== 13) return num + 'rd';
    return num + 'th';
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = [
    'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
  ];

  // Simple patterns
  if (cronExpression === '0 0 * * *' || cronExpression === '0 0 0 * * *') {
    return 'Daily at midnight';
  }
  
  if (cronExpression === '0 0 * * 0' || cronExpression === '0 0 0 * * 0') {
    return 'Weekly on Sunday at midnight';
  }
  
  if (cronExpression === '0 0 1 * *' || cronExpression === '0 0 0 1 * *') {
    return 'Monthly on the 1st at midnight';
  }

  // More complex parsing
  let result = '';
  
  // Frequency determination
  if (dayOfWeek !== '*' && dayOfMonth === '*') {
    // Weekly pattern
    if (dayOfWeek.includes(',')) {
      const days = dayOfWeek.split(',').map(d => dayNames[parseInt(d)]).join(', ');
      result = `Weekly on ${days}`;
    } else if (dayOfWeek.includes('-')) {
      const [start, end] = dayOfWeek.split('-').map(d => parseInt(d));
      result = `Weekly from ${dayNames[start]} to ${dayNames[end]}`;
    } else {
      result = `Weekly on ${dayNames[parseInt(dayOfWeek)]}`;
    }
  } else if (dayOfMonth !== '*' && dayOfWeek === '*') {
    // Monthly pattern
    if (dayOfMonth.includes(',')) {
      const days = dayOfMonth.split(',').map(d => getOrdinalSuffix(parseInt(d))).join(', ');
      result = `Monthly on the ${days}`;
    } else {
      result = `Monthly on the ${getOrdinalSuffix(parseInt(dayOfMonth))}`;
    }
  } else if (dayOfMonth !== '*' && dayOfWeek !== '*') {
    // Specific day and date
    result = `On the ${getOrdinalSuffix(parseInt(dayOfMonth))} and ${dayNames[parseInt(dayOfWeek)]}`;
  } else if (dayOfMonth === '*' && dayOfWeek === '*') {
    // Daily pattern
    result = 'Daily';
  } else {
    result = 'Custom schedule';
  }

  // Add time information
  if (hour !== '*' || minute !== '*') {
    const hourNum = hour === '*' ? 0 : parseInt(hour);
    const minuteNum = minute === '*' ? 0 : parseInt(minute);
    
    const timeStr = new Date(2000, 0, 1, hourNum, minuteNum)
      .toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    
    result += ` at ${timeStr}`;
  }

  // Add month information if specified
  if (month !== '*') {
    if (month.includes(',')) {
      const months = month.split(',').map(m => monthNames[parseInt(m) - 1]).join(', ');
      result += ` in ${months}`;
    } else {
      result += ` in ${monthNames[parseInt(month) - 1]}`;
    }
  }

  return result;
}
