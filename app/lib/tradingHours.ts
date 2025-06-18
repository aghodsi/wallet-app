// Trading hours utility for market data fetching optimization
// Based on https://www.tradinghours.com/markets

interface TradingSession {
  start: string; // Format: "HH:mm"
  end: string;   // Format: "HH:mm"
}

interface MarketHours {
  timezone: string;
  sessions: TradingSession[];
  tradingDays: number[]; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
}

// Top 10 global stock exchanges by market cap with their trading hours
const MARKET_HOURS: Record<string, MarketHours> = {
  // US Markets (NYSE, NASDAQ)
  'NYSE': {
    timezone: 'America/New_York',
    sessions: [{ start: '09:30', end: '16:00' }],
    tradingDays: [1, 2, 3, 4, 5] // Monday to Friday
  },
  'NASDAQ': {
    timezone: 'America/New_York', 
    sessions: [{ start: '09:30', end: '16:00' }],
    tradingDays: [1, 2, 3, 4, 5]
  },
  'NMS': {
    timezone: 'America/New_York',
    sessions: [{ start: '09:30', end: '16:00' }],
    tradingDays: [1, 2, 3, 4, 5]
  },
  'NYQ': {
    timezone: 'America/New_York',
    sessions: [{ start: '09:30', end: '16:00' }],
    tradingDays: [1, 2, 3, 4, 5]
  },

  // London Stock Exchange
  'LSE': {
    timezone: 'Europe/London',
    sessions: [{ start: '08:00', end: '16:30' }],
    tradingDays: [1, 2, 3, 4, 5]
  },
  'LON': {
    timezone: 'Europe/London',
    sessions: [{ start: '08:00', end: '16:30' }],
    tradingDays: [1, 2, 3, 4, 5]
  },

  // Tokyo Stock Exchange
  'TSE': {
    timezone: 'Asia/Tokyo',
    sessions: [
      { start: '09:00', end: '11:30' },
      { start: '12:30', end: '15:25' }
    ],
    tradingDays: [1, 2, 3, 4, 5]
  },
  'JPX': {
    timezone: 'Asia/Tokyo',
    sessions: [
      { start: '09:00', end: '11:30' },
      { start: '12:30', end: '15:25' }
    ],
    tradingDays: [1, 2, 3, 4, 5]
  },

  // Shanghai Stock Exchange
  'SSE': {
    timezone: 'Asia/Shanghai',
    sessions: [
      { start: '09:30', end: '11:30' },
      { start: '13:00', end: '14:57' }
    ],
    tradingDays: [1, 2, 3, 4, 5]
  },

  // Shenzhen Stock Exchange
  'SZSE': {
    timezone: 'Asia/Shanghai',
    sessions: [
      { start: '09:30', end: '11:30' },
      { start: '13:00', end: '14:57' }
    ],
    tradingDays: [1, 2, 3, 4, 5]
  },

  // Hong Kong Stock Exchange
  'HKEX': {
    timezone: 'Asia/Hong_Kong',
    sessions: [
      { start: '09:30', end: '12:00' },
      { start: '13:00', end: '16:00' }
    ],
    tradingDays: [1, 2, 3, 4, 5]
  },
  'HKG': {
    timezone: 'Asia/Hong_Kong',
    sessions: [
      { start: '09:30', end: '12:00' },
      { start: '13:00', end: '16:00' }
    ],
    tradingDays: [1, 2, 3, 4, 5]
  },

  // Euronext Paris
  'EPA': {
    timezone: 'Europe/Paris',
    sessions: [{ start: '09:00', end: '17:30' }],
    tradingDays: [1, 2, 3, 4, 5]
  },
  'PAR': {
    timezone: 'Europe/Paris',
    sessions: [{ start: '09:00', end: '17:30' }],
    tradingDays: [1, 2, 3, 4, 5]
  },

  // National Stock Exchange of India
  'NSE': {
    timezone: 'Asia/Kolkata',
    sessions: [{ start: '09:15', end: '15:30' }],
    tradingDays: [1, 2, 3, 4, 5]
  },
  'BSE': {
    timezone: 'Asia/Kolkata',
    sessions: [{ start: '09:15', end: '15:30' }],
    tradingDays: [1, 2, 3, 4, 5]
  },

  // Toronto Stock Exchange
  'TSX': {
    timezone: 'America/Toronto',
    sessions: [{ start: '09:30', end: '16:00' }],
    tradingDays: [1, 2, 3, 4, 5]
  },
  'TOR': {
    timezone: 'America/Toronto',
    sessions: [{ start: '09:30', end: '16:00' }],
    tradingDays: [1, 2, 3, 4, 5]
  },

  // Australian Securities Exchange
  'ASX': {
    timezone: 'Australia/Sydney',
    sessions: [{ start: '10:00', end: '16:00' }],
    tradingDays: [1, 2, 3, 4, 5]
  },
  'AUS': {
    timezone: 'Australia/Sydney',
    sessions: [{ start: '10:00', end: '16:00' }],
    tradingDays: [1, 2, 3, 4, 5]
  },

  // Frankfurt Stock Exchange (Xetra)
  'FRA': {
    timezone: 'Europe/Berlin',
    sessions: [{ start: '08:00', end: '22:00' }],
    tradingDays: [1, 2, 3, 4, 5]
  },
  'XETRA': {
    timezone: 'Europe/Berlin',
    sessions: [{ start: '08:00', end: '22:00' }],
    tradingDays: [1, 2, 3, 4, 5]
  },

  // Additional common exchange codes
  'BRU': { // Euronext Brussels
    timezone: 'Europe/Brussels',
    sessions: [{ start: '09:00', end: '17:30' }],
    tradingDays: [1, 2, 3, 4, 5]
  },
  'AMS': { // Euronext Amsterdam
    timezone: 'Europe/Amsterdam',
    sessions: [{ start: '09:00', end: '17:30' }],
    tradingDays: [1, 2, 3, 4, 5]
  },
  'MIL': { // Euronext Milan
    timezone: 'Europe/Rome',
    sessions: [{ start: '09:00', end: '17:30' }],
    tradingDays: [1, 2, 3, 4, 5]
  }
};

/**
 * Check if a market is currently open
 */
export function isMarketOpen(exchangeName: string, timezone?: string): boolean {
  const marketHours = getMarketHours(exchangeName, timezone);
  if (!marketHours) return true; // If unknown market, assume open for data fetching

  const now = new Date();
  const marketTime = new Date(now.toLocaleString("en-US", { timeZone: marketHours.timezone }));
  const dayOfWeek = marketTime.getDay();

  // Check if it's a trading day
  if (!marketHours.tradingDays.includes(dayOfWeek)) {
    return false;
  }

  // Check if current time is within trading sessions
  const currentTime = marketTime.getHours() * 60 + marketTime.getMinutes();
  
  return marketHours.sessions.some(session => {
    const [startHour, startMin] = session.start.split(':').map(Number);
    const [endHour, endMin] = session.end.split(':').map(Number);
    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;
    
    return currentTime >= startTime && currentTime <= endTime;
  });
}

/**
 * Check if it's a trading day (not weekend/holiday for the market)
 */
export function isTradingDay(exchangeName: string, timezone?: string, date?: Date): boolean {
  const marketHours = getMarketHours(exchangeName, timezone);
  if (!marketHours) return true;

  const checkDate = date || new Date();
  const marketTime = new Date(checkDate.toLocaleString("en-US", { timeZone: marketHours.timezone }));
  const dayOfWeek = marketTime.getDay();

  return marketHours.tradingDays.includes(dayOfWeek);
}

/**
 * Get the next market open time
 */
export function getNextMarketOpen(exchangeName: string, timezone?: string): Date | null {
  const marketHours = getMarketHours(exchangeName, timezone);
  if (!marketHours) return null;

  const now = new Date();
  let checkDate = new Date(now);
  
  // Look ahead up to 7 days to find next trading day
  for (let i = 0; i < 7; i++) {
    const marketTime = new Date(checkDate.toLocaleString("en-US", { timeZone: marketHours.timezone }));
    const dayOfWeek = marketTime.getDay();
    
    if (marketHours.tradingDays.includes(dayOfWeek)) {
      const [startHour, startMin] = marketHours.sessions[0].start.split(':').map(Number);
      const openTime = new Date(marketTime);
      openTime.setHours(startHour, startMin, 0, 0);
      
      // If it's today and market hasn't opened yet, or if it's a future day
      if (i > 0 || openTime > now) {
        return openTime;
      }
    }
    
    checkDate.setDate(checkDate.getDate() + 1);
  }
  
  return null;
}

/**
 * Get the last market close time
 */
export function getLastMarketClose(exchangeName: string, timezone?: string): Date | null {
  const marketHours = getMarketHours(exchangeName, timezone);
  if (!marketHours) return null;

  const now = new Date();
  let checkDate = new Date(now);
  
  // Look back up to 7 days to find last trading day
  for (let i = 0; i < 7; i++) {
    const marketTime = new Date(checkDate.toLocaleString("en-US", { timeZone: marketHours.timezone }));
    const dayOfWeek = marketTime.getDay();
    
    if (marketHours.tradingDays.includes(dayOfWeek)) {
      const lastSession = marketHours.sessions[marketHours.sessions.length - 1];
      const [endHour, endMin] = lastSession.end.split(':').map(Number);
      const closeTime = new Date(marketTime);
      closeTime.setHours(endHour, endMin, 0, 0);
      
      // If it's today and market has closed, or if it's a past day
      if (i > 0 || closeTime < now) {
        return closeTime;
      }
    }
    
    checkDate.setDate(checkDate.getDate() - 1);
  }
  
  return null;
}

/**
 * Determine if data fetching should proceed based on market conditions
 */
export function shouldFetchData(
  exchangeName: string, 
  timezone?: string, 
  lastUpdated?: Date,
  forceRefresh: boolean = false
): {
  shouldFetch: boolean;
  reason: string;
  nextFetchTime?: Date;
} {
  if (forceRefresh) {
    return { shouldFetch: true, reason: 'Force refresh requested' };
  }

  const marketHours = getMarketHours(exchangeName, timezone);
  if (!marketHours) {
    return { shouldFetch: true, reason: 'Unknown market, allowing fetch' };
  }

  const now = new Date();
  const isOpen = isMarketOpen(exchangeName, timezone);
  const isTradingToday = isTradingDay(exchangeName, timezone);

  // If market is closed and it's not a trading day, don't fetch
  if (!isTradingToday) {
    const nextOpen = getNextMarketOpen(exchangeName, timezone);
    return { 
      shouldFetch: false, 
      reason: 'Market closed - not a trading day',
      nextFetchTime: nextOpen || undefined
    };
  }

  // If no lastUpdated, allow fetch
  if (!lastUpdated) {
    return { shouldFetch: true, reason: 'No previous data' };
  }

  const timeSinceUpdate = now.getTime() - lastUpdated.getTime();
  const minutesSinceUpdate = timeSinceUpdate / (1000 * 60);

  // If market is open
  if (isOpen) {
    // During trading hours, fetch if it's been more than 15 minutes
    if (minutesSinceUpdate >= 15) {
      return { shouldFetch: true, reason: 'Market open - data stale (>15 min)' };
    } else {
      return { 
        shouldFetch: false, 
        reason: 'Market open - data fresh (<15 min)',
        nextFetchTime: new Date(lastUpdated.getTime() + 15 * 60 * 1000)
      };
    }
  } else {
    // Market is closed but it's a trading day
    const lastClose = getLastMarketClose(exchangeName, timezone);
    
    // If we have data from after the last market close, don't fetch
    if (lastClose && lastUpdated > lastClose) {
      const nextOpen = getNextMarketOpen(exchangeName, timezone);
      return { 
        shouldFetch: false, 
        reason: 'Market closed - have post-close data',
        nextFetchTime: nextOpen || undefined
      };
    }
    
    // If it's been more than 1 hour since last update and market has closed recently, fetch once
    if (minutesSinceUpdate >= 60) {
      return { shouldFetch: true, reason: 'Market closed - fetching post-close data' };
    }
    
    const nextOpen = getNextMarketOpen(exchangeName, timezone);
    return { 
      shouldFetch: false, 
      reason: 'Market closed - recent post-close fetch',
      nextFetchTime: nextOpen || undefined
    };
  }
}

/**
 * Get market hours configuration for an exchange
 */
function getMarketHours(exchangeName: string, timezone?: string): MarketHours | null {
  // Try exact match first
  let marketHours = MARKET_HOURS[exchangeName.toUpperCase()];
  
  if (!marketHours && timezone) {
    // If no exact match and we have timezone info, try to infer from timezone
    const timezoneToExchange: Record<string, string> = {
      'America/New_York': 'NYSE',
      'Europe/London': 'LSE', 
      'Asia/Tokyo': 'TSE',
      'Asia/Shanghai': 'SSE',
      'Asia/Hong_Kong': 'HKEX',
      'Europe/Paris': 'EPA',
      'Asia/Kolkata': 'NSE',
      'America/Toronto': 'TSX',
      'Australia/Sydney': 'ASX',
      'Europe/Berlin': 'FRA'
    };
    
    const inferredExchange = timezoneToExchange[timezone];
    if (inferredExchange) {
      marketHours = MARKET_HOURS[inferredExchange];
    }
  }
  
  return marketHours || null;
}

/**
 * Get human-readable market status
 */
export function getMarketStatus(exchangeName: string, timezone?: string): string {
  const isOpen = isMarketOpen(exchangeName, timezone);
  const isTradingToday = isTradingDay(exchangeName, timezone);
  
  if (!isTradingToday) {
    return 'Market Closed - Non-trading day';
  }
  
  return isOpen ? 'Market Open' : 'Market Closed';
}

/**
 * Get all supported exchanges
 */
export function getSupportedExchanges(): string[] {
  return Object.keys(MARKET_HOURS);
}
