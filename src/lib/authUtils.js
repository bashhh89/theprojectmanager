import { supabase } from './supabaseClient';

/**
 * Sign in a user with email and password
 * @param {string} email - User's email
 * @param {string} password - User's password
 * @returns {Promise<{ data, error }>} - Supabase auth response
 */
export async function signIn(email, password) {
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
 * Sign out the current user
 * @returns {Promise<{ error }>} - Supabase auth response
 */
export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut();
    // Clear local storage
    localStorage.removeItem('supabase.auth.token');
    return { error };
  } catch (error) {
    console.error('Sign out error:', error);
    return { error };
  }
}

/**
 * Get the current session
 * @returns {Promise<{ session, error }>} - Current session or error
 */
export async function getSession() {
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
export async function isAuthenticated() {
  const { session, error } = await getSession();
  return !!session && !error;
}

/**
 * Require authentication - returns the user if authenticated, null otherwise
 * @returns {Promise<Object|null>} - User object if authenticated, null otherwise
 */
export async function requireAuth() {
  try {
    const { data, error } = await supabase.auth.getUser();
    
    if (error || !data.user) {
      return null;
    }
    
    return data.user;
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}

/**
 * Redirects to login page if not authenticated
 * Uses the Next.js router to redirect the user
 * @param {Object} router - Next.js router object
 * @returns {Promise<Object|null>} - User object if authenticated, null after redirect attempt
 */
export async function redirectIfUnauthenticated(router) {
  try {
    const { data, error } = await supabase.auth.getUser();
    
    if (error || !data.user) {
      // Redirect to login page
      router.push('/login');
      return null;
    }
    
    return data.user;
  } catch (error) {
    console.error('Authentication redirect error:', error);
    router.push('/login');
    return null;
  }
} 