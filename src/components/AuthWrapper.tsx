'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

// Updated with more comprehensive public routes
const publicRoutes = [
  '/', 
  '/login', 
  '/signup', 
  '/register',
  '/auth',
  '/forgot-password',
  '/reset-password',
  '/register/confirmation'
];

export default function AuthWrapper({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { loading, user } = useAuth();
  // Use true as initial state to avoid blank screen
  const [mounted, setMounted] = useState(true);

  useEffect(() => {
    // Redirect to login if not authenticated and not on public route
    const cleanedPathname = pathname.endsWith('/') && pathname.length > 1 
      ? pathname.slice(0, -1) 
      : pathname;
      
    if (!loading && !user && !publicRoutes.includes(cleanedPathname)) {
      console.log("AuthWrapper: Redirecting to /login");
      router.push('/login');
    }
  }, [loading, user, pathname, router]);

  // Check if current route is public
  const cleanedPathname = pathname.endsWith('/') && pathname.length > 1 
    ? pathname.slice(0, -1) 
    : pathname;
  const isPublicRoute = publicRoutes.includes(cleanedPathname);

  // For public routes, always render children immediately
  if (isPublicRoute) {
    console.log("AuthWrapper: Public route, rendering children immediately", { pathname, cleanedPathname });
    return <>{children}</>;
  }

  // For protected routes, apply normal loading/auth checks
  
  // Ensure component is mounted  
  if (!mounted) {
    console.log("AuthWrapper: Not mounted, returning null");
    return null;
  }

  // Show loading state for protected routes
  if (loading) {
    console.log("AuthWrapper: Loading auth state...");
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-900">
        <p className="text-zinc-400">Loading...</p>
      </div>
    );
  }

  // For authenticated users on protected routes
  if (user) {
    console.log("AuthWrapper: User authenticated, rendering children", { user: !!user });
    return <>{children}</>;
  }

  // Don't render anything for unauthenticated users on protected routes (while redirecting)
  console.log("AuthWrapper: Not public, not authenticated, returning null for redirect", { pathname });
  return null;
} 