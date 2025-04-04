import { createBrowserClient } from '@supabase/ssr';
import { type User, Session } from '@supabase/supabase-js';
import { supabase } from './supabaseClient';

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fdbnkgicweyfixbhfcgx.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZkYm5rZ2ljd2V5Zml4YmhmY2d4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMxMjYyMjQsImV4cCI6MjA1ODcwMjIyNH0.lPLD1le6i0Y64x_uXyMndUqMKQ2XEyIUn0sEvfL5KNk';

/**
 * Creates a Supabase client for browser usage
 */
export function getSupabaseBrowserClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

/**
 * Checks if a user is currently authenticated
 * @returns Promise with the user object or null
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const { data } = await supabase.auth.getUser();
    return data.user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

/**
 * Signs the user out
 */
export async function signOut() {
  try {
    await supabase.auth.signOut();
    // Clear any session data from localStorage and cookies
    localStorage.removeItem('supabase.auth.token');
    document.cookie = 'supabase-auth-token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;';
  } catch (error) {
    console.error('Error signing out:', error);
  }
}

/**
 * Signs the user in with email and password
 */
export async function signIn(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (data && data.session) {
      // Create a custom event to notify other parts of the app
      if (typeof window !== 'undefined') {
        const event = new CustomEvent('authStateChange', { 
          detail: { user: data.user, session: data.session } 
        });
        window.dispatchEvent(event);
      }
    }

    return { data, error };
  } catch (error) {
    console.error('Sign in error:', error);
    return { data: null, error };
  }
}

/**
 * Registers a new user with email and password
 */
export async function signUp(email: string, password: string, redirectTo?: string) {
  try {
    return await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectTo || `${window.location.origin}/dashboard`,
      }
    });
  } catch (error) {
    console.error('Sign up error:', error);
    return { data: null, error };
  }
}

/**
 * Checks if a user is authorized to access a protected route
 * If not authorized, redirects to login page
 */
export async function requireAuth(redirectTo: string = '/login'): Promise<User | null> {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      if (typeof window !== 'undefined') {
        window.location.href = redirectTo;
      }
      return null;
    }
    
    return user;
  } catch (error) {
    console.error('Error in requireAuth:', error);
    if (typeof window !== 'undefined') {
      window.location.href = redirectTo;
    }
    return null;
  }
}

/**
 * Get the current session
 * @returns {Promise<{ session: Session | null; error: any }>} - Current session or error
 */
export async function getSession(): Promise<{ session: Session | null; error: any }> {
  try {
    const { data, error } = await supabase.auth.getSession();
    return { session: data?.session || null, error };
  } catch (error) {
    console.error('Get session error:', error);
    return { session: null, error };
  }
}

/**
 * Check if a user is authenticated
 * @returns {Promise<boolean>} - Whether the user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  try {
    const { session } = await getSession();
    return !!session;
  } catch (error) {
    console.error('Auth check error:', error);
    return false;
  }
}

// Add an auth state change listener if in the browser
if (typeof window !== 'undefined') {
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN' && session) {
      console.log('User signed in successfully');
    } else if (event === 'SIGNED_OUT') {
      console.log('User signed out');
    }
  });
} 