'use client';

import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { Session, User } from '@supabase/supabase-js';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const createUserProfile = async (userId: string, email: string) => {
    console.log('Creating user profile for:', { userId, email });
    
    try {
      // First check if profile already exists
      const { data: existingProfile, error: checkError } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('id', userId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error('Error checking existing profile:', checkError);
        throw checkError;
      }

      if (existingProfile) {
        console.log('User profile already exists:', existingProfile);
        return;
      }

      // Create new profile if it doesn't exist
      const { data: newProfile, error: insertError } = await supabase
        .from('user_profiles')
        .insert([
          {
            id: userId,
            role: 'user',
            full_name: email.split('@')[0],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ])
        .select()
        .single();

      if (insertError) {
        console.error('Error creating user profile:', {
          code: insertError.code,
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint
        });
        throw insertError;
      }

      console.log('User profile created successfully:', newProfile);
    } catch (error: any) {
      console.error('Error in profile creation:', {
        name: error.name,
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      throw error;
    }
  };

  useEffect(() => {
    console.log("AuthProvider: Initializing auth state");
    
    // Add a safety timeout to prevent endless loading
    const safetyTimeout = setTimeout(() => {
      if (loading) {
        console.log("AuthProvider: Safety timeout reached, forcing loading to false");
        setLoading(false);
      }
    }, 3000); // 3 second timeout
    
    // 1. Check for initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log("AuthProvider: Initial session check complete", !!session);
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      // 2. Set up the auth state change listener
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (_event, session) => {
          console.log("Auth state changed:", _event, session?.user?.email);
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);

          // If this is a new signup or first login, create the user profile
          if ((_event === 'SIGNED_IN' || _event === 'TOKEN_REFRESHED') && session?.user) {
            try {
              await createUserProfile(session.user.id, session.user.email || '');
            } catch (error) {
              console.error('Failed to create/verify user profile:', error);
            }
          }
        }
      );

      return () => {
        subscription.unsubscribe();
        clearTimeout(safetyTimeout);
      };
    });
  }, []);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setSession(null);
      setUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ session, user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};