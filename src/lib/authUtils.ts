import { createBrowserClient } from '@supabase/ssr';
import { type User, Session } from '@supabase/supabase-js';
import { supabase } from './supabaseClient';

// Supabase configuration
const supabaseUrl = 'https://fdbnkgicweyfixbhfcgx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZkYm5rZ2ljd2V5Zml4YmhmY2d4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMxMjYyMjQsImV4cCI6MjA1ODcwMjIyNH0.lPLD1le6i0Y64x_uXyMndUqMKQ2XEyIUn0sEvfL5KNk';

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
  const supabase = getSupabaseBrowserClient();
  const { data } = await supabase.auth.getUser();
  return data.user;
}

/**
 * Signs the user out
 */
export async function signOut() {
  const supabase = getSupabaseBrowserClient();
  await supabase.auth.signOut();
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

    // Store session in localStorage for extra persistence
    if (data && data.session) {
      localStorage.setItem('supabase.auth.token', JSON.stringify(data.session));
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
  const supabase = getSupabaseBrowserClient();
  return await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: redirectTo || `${window.location.origin}/agents`,
    }
  });
}

/**
 * Checks if a user is authorized to access a protected route
 * If not authorized, redirects to login page
 */
export async function requireAuth(redirectTo: string = '/login'): Promise<User | null> {
  const user = await getCurrentUser();
  
  if (!user) {
    window.location.href = redirectTo;
    return null;
  }
  
  return user;
}

/**
 * Get the current session
 * @returns {Promise<{ session: Session | null; error: any }>} - Current session or error
 */
export async function getSession(): Promise<{ session: Session | null; error: any }> {
  try {
    // First try to get from Supabase
    const { data, error } = await supabase.auth.getSession();
    
    // If no session from Supabase, try from localStorage
    if ((!data || !data.session) && !error) {
      const storedSession = localStorage.getItem('supabase.auth.token');
      if (storedSession) {
        try {
          const parsedSession = JSON.parse(storedSession);
          // Attempt to refresh the session
          const { data: refreshData } = await supabase.auth.refreshSession({
            refresh_token: parsedSession.refresh_token,
          });
          
          if (refreshData && refreshData.session) {
            return { session: refreshData.session, error: null };
          }
        } catch (e) {
          console.error('Error parsing stored session:', e);
        }
      }
    }
    
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
  const { session, error } = await getSession();
  return !!session && !error;
} 