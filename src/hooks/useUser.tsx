import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { User } from '@supabase/supabase-js';

interface UserDetails {
  full_name?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  id?: string;
}

interface UseUserReturn {
  user: User | null;
  userDetails: UserDetails | null;
  loading: boolean;
  error: Error | null;
}

export function useUser(): UseUserReturn {
  const [user, setUser] = useState<User | null>(null);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function getUser() {
      try {
        setLoading(true);
        
        // Get the current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) throw userError;
        
        if (user) {
          setUser(user);
          
          // Get user profile details
          const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', user.id)
            .single();
            
          if (profileError && profileError.code !== 'PGRST116') {
            // PGRST116 is "No rows returned" - that's okay if the user hasn't set up their profile
            console.warn("Error fetching user profile:", profileError);
          }
          
          // Construct a userDetails object
          const details: UserDetails = {
            id: user.id,
            email: user.email,
            ...profile
          };
          
          // If profile doesn't exist, we still want to extract name from email
          if (!details.full_name && details.email) {
            details.first_name = details.email.split('@')[0];
          }
          
          setUserDetails(details);
        }
      } catch (err) {
        console.error("Error in useUser hook:", err);
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setLoading(false);
      }
    }
    
    getUser();
    
    // Set up auth state change listener
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          // User signed in or token refreshed, get user details
          getUser();
        } else if (event === 'SIGNED_OUT') {
          // User signed out, clear state
          setUser(null);
          setUserDetails(null);
        }
      }
    );
    
    // Clean up subscription
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);
  
  return { user, userDetails, loading, error };
} 