import { logError } from './errorLogging';

interface ApiError extends Error {
  status?: number;
  code?: string;
}

export async function apiRequest<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error: ApiError = new Error('API request failed');
      error.status = response.status;
      throw error;
    }

    return await response.json();
  } catch (error) {
    // Log the error with context
    logError({
      error: error instanceof Error ? error.toString() : 'Unknown API error',
      context: JSON.stringify({
        url,
        method: options.method || 'GET',
        status: (error as ApiError).status,
      }),
    });
    throw error;
  }
}

// Utility function for handling API errors in components
export function handleApiError(error: unknown, friendlyMessage?: string) {
  const message = friendlyMessage || 'Something went wrong. Please try again.';
  
  logError({
    error: error instanceof Error ? error.toString() : 'Unknown error',
    context: 'API Error Handler',
  });

  // You can integrate this with your UI notification system
  console.error(message);
  return message;
} 