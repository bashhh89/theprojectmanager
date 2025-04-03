'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    async function checkAdminAccess() {
      try {
        if (authLoading) {
          return; // Wait for auth to complete
        }

        if (!user) {
          router.push('/login');
          return;
        }

        // First check if user profile exists
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (profileError) {
          if (profileError.code === 'PGRST116') {
            // Profile doesn't exist, create it
            const { error: insertError } = await supabase
              .from('user_profiles')
              .insert([
                {
                  id: user.id,
                  role: 'user',
                  full_name: user.user_metadata?.full_name || user.email?.split('@')[0]
                }
              ]);

            if (insertError) {
              console.error('Error creating user profile:', insertError);
              router.push('/dashboard');
              return;
            }
          } else {
            console.error('Error fetching user profile:', profileError);
            router.push('/dashboard');
            return;
          }
        }

        // Check if user is admin
        if (profile?.role !== 'admin') {
          router.push('/dashboard');
          return;
        }

        setIsAdmin(true);
      } catch (error) {
        console.error('Error checking admin access:', error);
        router.push('/dashboard');
      } finally {
        setIsLoading(false);
      }
    }

    checkAdminAccess();
  }, [user, authLoading, router]);

  if (isLoading || authLoading) {
    return (
      <div className="min-h-screen bg-zinc-900 text-zinc-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return <>{children}</>;
} 