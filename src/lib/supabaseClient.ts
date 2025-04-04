// src/lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

// Get Supabase URL and key from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fdbnkgicweyfixbhfcgx.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZkYm5rZ2ljd2V5Zml4YmhmY2d4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMxMjYyMjQsImV4cCI6MjA1ODcwMjIyNH0.lPLD1le6i0Y64x_uXyMndUqMKQ2XEyIUn0sEvfL5KNk';

// Check if running in browser environment
const isBrowser = typeof window !== 'undefined';

// Create and export the Supabase client instance with enhanced session persistence
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    // Use both local storage and cookies for better persistence
    storage: {
      getItem: (key) => {
        if (!isBrowser) return null;
        
        // Try localStorage first
        try {
          const storedItem = localStorage.getItem(key);
          if (storedItem) return storedItem;
        } catch (e) {
          console.log('localStorage access error:', e);
        }
        
        // Fallback to cookies
        try {
          const cookies = document.cookie.split(';');
          const cookie = cookies.find(c => c.trim().startsWith(`${key}=`));
          return cookie ? cookie.split('=')[1] : null;
        } catch (e) {
          console.log('Cookie access error:', e);
          return null;
        }
      },
      setItem: (key, value) => {
        if (!isBrowser) return;
        
        // Store in localStorage
        try {
          localStorage.setItem(key, value);
        } catch (e) {
          console.log('localStorage set error:', e);
        }
        
        // Set cookie with SameSite=Strict and secure flags
        try {
          const date = new Date();
          date.setTime(date.getTime() + (7 * 24 * 60 * 60 * 1000)); // 7 days
          document.cookie = `${key}=${value}; expires=${date.toUTCString()}; path=/; SameSite=Strict`;
        } catch (e) {
          console.log('Cookie set error:', e);
        }
      },
      removeItem: (key) => {
        if (!isBrowser) return;
        
        // Remove from localStorage
        try {
          localStorage.removeItem(key);
        } catch (e) {
          console.log('localStorage remove error:', e);
        }
        
        // Remove from cookies
        try {
          document.cookie = `${key}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`;
        } catch (e) {
          console.log('Cookie remove error:', e);
        }
      }
    },
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

// Set up event listeners only in browser environment
if (isBrowser) {
  // Set up session refresh on visibility change
  document.addEventListener('visibilitychange', async () => {
    if (document.visibilityState === 'visible') {
      // Refresh the session when tab becomes visible again
      const { error } = await supabase.auth.refreshSession();
      if (error) {
        console.error('Session refresh error:', error);
      }
    }
  });

  // Attempt to recover session on page load
  (async () => {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Session retrieval error:', error);
      } else if (data?.session) {
        console.log('Session successfully retrieved');
      }
    } catch (err) {
      console.error('Error checking session:', err);
    }
  })();
  
  console.log('Supabase client utility loaded with enhanced session persistence.');
}