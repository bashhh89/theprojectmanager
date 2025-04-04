'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

// Expanded list of public routes
const publicRoutes = [
  '/', 
  '/login', 
  '/signup', 
  '/register',
  '/auth',
  '/forgot-password',
  '/reset-password',
  '/register/confirmation',
  '/products', 
  '/products/new',
  '/proposals',
  '/shared-proposal',
  '/company',
  '/tools/presentation-generator',
  '/my-presentations',
  '/foundational-partner'
];

// Add path checking helper that handles path patterns
const isPublicPath = (path: string) => {
  const cleanedPath = path.endsWith('/') && path.length > 1 
    ? path.slice(0, -1) 
    : path;
  
  // Check if path is exactly in the publicRoutes list
  if (publicRoutes.includes(cleanedPath)) {
    return true;
  }
  
  // Check if path starts with any of these patterns
  const publicPathPatterns = [
    '/shared-proposal/', 
    '/tools/', 
    '/products/',
    '/proposals/',
    '/api/',
    '/foundational-partner/'
  ];
  
  return publicPathPatterns.some(pattern => cleanedPath.startsWith(pattern));
};

export default function AuthWrapper({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { loading, user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [redirectInProgress, setRedirectInProgress] = useState(false);

  useEffect(() => {
    setMounted(true);
    console.log('[AUTH-DEBUG] AuthWrapper mounted, current auth state:', { 
      loading, 
      user: !!user, 
      userEmail: user?.email,
      pathname 
    });
  }, [loading, user, pathname]);

  // TEMPORARY FIX: Disable automatic redirects completely to debug the login issue
  const DISABLE_REDIRECTS = true;

  // Handle redirects with rate limiting to prevent loops
  useEffect(() => {
    if (DISABLE_REDIRECTS) {
      console.log('[AUTH-DEBUG] Redirects temporarily disabled for debugging');
      return;
    }

    // Skip if a redirect is already in progress
    if (redirectInProgress) {
      return;
    }

    const isPublic = isPublicPath(pathname);
    
    console.log('[AUTH-DEBUG] Auth state changed:', { 
      loading, 
      authenticated: !!user, 
      pathname,
      isPublic,
      redirectInProgress
    });

    // Only redirect if not loading (auth state is determined)
    if (!loading) {
      // Case 1: Unauthenticated user on protected route -> redirect to login
      if (!user && !isPublic) {
        console.log("[AUTH-DEBUG] Redirecting to /login");
        setRedirectInProgress(true);
        
        // Use a setTimeout to prevent potential rapid redirect loops
        setTimeout(() => {
          router.push('/login');
          // Reset the redirect flag after a delay
          setTimeout(() => setRedirectInProgress(false), 2000);
        }, 100);
      }
      
      // Case 2: Authenticated user on login page -> redirect to dashboard
      // Only apply this if user is on the specific login page, not any public page
      else if (user && (pathname === '/login' || pathname === '/signup')) {
        console.log("[AUTH-DEBUG] Redirecting authenticated user from login to /chat");
        setRedirectInProgress(true);
        
        setTimeout(() => {
          router.push('/chat');
          // Reset the redirect flag after a delay
          setTimeout(() => setRedirectInProgress(false), 2000);
        }, 100);
      }
    }
  }, [loading, user, pathname, router, redirectInProgress]);

  // Check if current route is public
  const isPublicRoute = isPublicPath(pathname);

  // For public routes, always render children immediately
  if (isPublicRoute) {
    return <>{children}</>;
  }

  // Always render children if redirects are disabled (debug mode)
  if (DISABLE_REDIRECTS) {
    return <>{children}</>;
  }
  
  // Ensure component is mounted  
  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-900">
        <p className="text-zinc-400">Initializing application...</p>
      </div>
    );
  }

  // Show loading state for protected routes
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-900">
        <p className="text-zinc-400">Loading authentication...</p>
      </div>
    );
  }

  // For authenticated users on protected routes
  if (user) {
    return <>{children}</>;
  }

  // Don't render anything for unauthenticated users on protected routes (while redirecting)
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-900">
      <p className="text-zinc-400">Redirecting to login...</p>
    </div>
  );
} 