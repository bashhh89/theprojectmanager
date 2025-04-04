import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Export the middleware function as default
export default function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  
  // Check for auth-related cookies and ensure they are preserved
  const authCookie = request.cookies.get('supabase-auth-token');
  
  // Redirect /projects/create to /projects/new
  if (url.pathname === '/projects/create') {
    url.pathname = '/projects/new';
    const response = NextResponse.redirect(url);
    
    // Preserve auth cookies in redirects
    if (authCookie) {
      response.cookies.set('supabase-auth-token', authCookie.value, {
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/'
      });
    }
    
    return response;
  }
  
  return NextResponse.next();
}

// See: https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
export const config = {
  matcher: ['/projects/create'],
}; 