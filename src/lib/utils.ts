import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combines and merges class names using clsx and tailwind-merge
 * @param inputs - Class values to merge
 * @returns Merged class string
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a date for display
 * @param date - Date to format
 * @param options - Intl.DateTimeFormatOptions
 * @returns Formatted date string
 */
export function formatDate(
  date: Date | string,
  options: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }
) {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', options).format(d);
}

/**
 * Returns a relative time string (e.g., "2 hours ago")
 * @param date - Date to format
 * @returns Relative time string
 */
export function getRelativeTime(date: Date | string) {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) {
    return 'just now';
  } else if (diffMins < 60) {
    return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  } else if (diffDays < 7) {
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  } else {
    return formatDate(d);
  }
}

/**
 * Truncates text to a specified length and adds ellipsis if needed
 * @param text - Text to truncate
 * @param length - Maximum length
 * @returns Truncated text
 */
export function truncateText(text: string, length: number) {
  if (text.length <= length) return text;
  return text.slice(0, length) + '...';
}

/**
 * Generates a random ID
 * @param prefix - Optional prefix for the ID
 * @returns Random ID string
 */
export function generateId(prefix = 'qandu') {
  return `${prefix}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Converts a string to a slug format (lowercase, hyphenated)
 * @param text - Text to convert to slug
 * @returns Slugified text
 */
export function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\w ]+/g, '')
    .replace(/ +/g, '-');
}

/**
 * Debounces a function
 * @param fn - Function to debounce
 * @param ms - Debounce delay in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  ms = 300
) {
  let timeoutId: ReturnType<typeof setTimeout>;
  return function (...args: Parameters<T>) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), ms);
  };
}

/**
 * Returns a random item from an array
 * @param arr - Array to select from
 * @returns Random item from the array
 */
export function getRandomArrayItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Returns whether a given feature is enabled
 * @param featureName - Name of the feature to check
 * @returns Boolean indicating if feature is enabled
 */
export function isFeatureEnabled(featureName: string): boolean {
  if (typeof window === 'undefined') return false;
  
  const QANDU_FEATURES = window.localStorage.getItem('QANDU_FEATURES');
  if (!QANDU_FEATURES) return false;
  
  try {
    const features = JSON.parse(QANDU_FEATURES);
    return !!features[featureName];
  } catch (e) {
    return false;
  }
}

/**
 * Apply dark mode to HTML element and localStorage
 * @returns void
 */
export function setDarkMode() {
  // Add dark class to document element
  if (typeof document !== 'undefined') {
    document.documentElement.classList.add('dark');
  }
  
  // Set in local storage if available
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('theme', 'dark');
  }
}

/**
 * Apply light mode to HTML element and localStorage
 * @returns void
 */
export function setLightMode() {
  // Remove dark class from document element
  if (typeof document !== 'undefined') {
    document.documentElement.classList.remove('dark');
  }
  
  // Set in local storage if available
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('theme', 'light');
  }
}

/**
 * Get current theme status
 * @returns 'dark' | 'light'
 */
export function getCurrentTheme(): 'dark' | 'light' {
  // Check if rendering on server
  if (typeof window === 'undefined') return 'dark'; // Default to dark

  // Check localStorage value
  if (typeof localStorage !== 'undefined') {
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme === 'dark' || storedTheme === 'light') {
      return storedTheme;
    }
  }

  // Check for OS theme preference
  if (typeof window !== 'undefined' && window.matchMedia) {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
  }

  // Default to dark for our Gemini style app
  return 'dark';
}

/**
 * Error logging levels
 */
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal'
}

interface LogOptions {
  context?: string;
  data?: any;
  userId?: string;
  sendToServer?: boolean;
  silent?: boolean;
}

/**
 * Centralized logging utility to standardize error logging
 */
export const logger = {
  /**
   * Log a debug message
   */
  debug: (message: string, options: LogOptions = {}) => {
    if (process.env.NODE_ENV === 'development' || localStorage.getItem('debug_mode') === 'true') {
      const formattedMessage = formatLogMessage(LogLevel.DEBUG, message, options);
      console.debug(formattedMessage, options.data || '');
      if (options.sendToServer) sendLogToServer(LogLevel.DEBUG, message, options);
    }
  },

  /**
   * Log an info message
   */
  info: (message: string, options: LogOptions = {}) => {
    const formattedMessage = formatLogMessage(LogLevel.INFO, message, options);
    console.info(formattedMessage, options.data || '');
    if (options.sendToServer) sendLogToServer(LogLevel.INFO, message, options);
  },

  /**
   * Log a warning message
   */
  warn: (message: string, options: LogOptions = {}) => {
    const formattedMessage = formatLogMessage(LogLevel.WARN, message, options);
    console.warn(formattedMessage, options.data || '');
    if (options.sendToServer) sendLogToServer(LogLevel.WARN, message, options);
  },

  /**
   * Log an error message
   */
  error: (message: string, error?: any, options: LogOptions = {}) => {
    const formattedMessage = formatLogMessage(LogLevel.ERROR, message, options);
    console.error(formattedMessage, error, options.data || '');
    if (options.sendToServer) sendLogToServer(LogLevel.ERROR, message, { ...options, data: { error, ...options.data } });
  },

  /**
   * Log a fatal error message
   */
  fatal: (message: string, error?: any, options: LogOptions = {}) => {
    const formattedMessage = formatLogMessage(LogLevel.FATAL, message, options);
    console.error(formattedMessage, error, options.data || '');
    sendLogToServer(LogLevel.FATAL, message, { ...options, data: { error, ...options.data } });
  }
};

/**
 * Format log message with timestamp and context
 */
function formatLogMessage(level: LogLevel, message: string, options: LogOptions): string {
  const timestamp = new Date().toISOString();
  const context = options.context ? `[${options.context}]` : '';
  return `[${timestamp}] [${level.toUpperCase()}] ${context} ${message}`;
}

/**
 * Send log to server for persistent storage
 * This can be expanded to send logs to a server endpoint
 */
async function sendLogToServer(level: LogLevel, message: string, options: LogOptions) {
  // Only send to server in production or if explicitly requested
  if (process.env.NODE_ENV !== 'production' && !options.sendToServer) return;
  
  try {
    // In a real implementation, this would send to a logging endpoint
    // For now, we'll just console log that we would send
    if (!options.silent) {
      console.info(`[LOGGER] Would send to server: ${level} - ${message}`);
    }
    
    // Example implementation:
    // await fetch('/api/logs', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     level,
    //     message,
    //     context: options.context,
    //     data: options.data,
    //     userId: options.userId,
    //     timestamp: new Date().toISOString(),
    //   }),
    // });
  } catch (error) {
    // Don't use the logger here to avoid infinite loops
    console.error('[LOGGER] Failed to send log to server:', error);
  }
}
