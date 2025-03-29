import { createBrowserClient } from '@supabase/ssr';
import { type User } from '@supabase/supabase-js';

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
  const supabase = getSupabaseBrowserClient();
  return await supabase.auth.signInWithPassword({
    email,
    password,
  });
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