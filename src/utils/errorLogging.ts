import { supabase } from '@/lib/supabaseClient';

interface ErrorDetails {
  error: string;
  componentStack?: string;
  context?: string;
  url?: string;
  userId?: string;
  additionalData?: Record<string, any>;
}

export async function logError(details: ErrorDetails) {
  try {
    const { error: insertError } = await supabase
      .from('system_logs')
      .insert({
        level: 'error',
        message: details.error,
        context: JSON.stringify({
          componentStack: details.componentStack,
          url: details.url,
          userId: details.userId,
          ...details.context && { additionalContext: details.context }
        })
      });

    if (insertError) {
      console.error('Failed to log error:', insertError);
    }
  } catch (err) {
    console.error('Error logging failed:', err);
  }
}

export async function logInfo(message: string, context?: any) {
  try {
    const { error: insertError } = await supabase
      .from('system_logs')
      .insert({
        level: 'info',
        message,
        context: context ? JSON.stringify(context) : null
      });

    if (insertError) {
      console.error('Failed to log info:', insertError);
    }
  } catch (err) {
    console.error('Info logging failed:', err);
  }
}

export async function logWarning(message: string, context?: any) {
  try {
    const { error: insertError } = await supabase
      .from('system_logs')
      .insert({
        level: 'warn',
        message,
        context: context ? JSON.stringify(context) : null
      });

    if (insertError) {
      console.error('Failed to log warning:', insertError);
    }
  } catch (err) {
    console.error('Warning logging failed:', err);
  }
} 