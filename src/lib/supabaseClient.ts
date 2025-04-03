// src/lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

// Get Supabase URL and key from environment variables instead of hardcoding them
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fdbnkgicweyfixbhfcgx.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZkYm5rZ2ljd2V5Zml4YmhmY2d4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMxMjYyMjQsImV4cCI6MjA1ODcwMjIyNH0.lPLD1le6i0Y64x_uXyMndUqMKQ2XEyIUn0sEvfL5KNk';

// Create and export the Supabase client instance with persistent session
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    storageKey: 'nqq-supabase-auth',
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

console.log('Supabase client utility loaded with persistent session configuration.');