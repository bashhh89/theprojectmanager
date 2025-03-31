import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Export the middleware function as default
export default function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  
  // Redirect /projects/create to /projects/new
  if (url.pathname === '/projects/create') {
    url.pathname = '/projects/new';
    return NextResponse.redirect(url);
  }
  
  return NextResponse.next();
}

// See: https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
export const config = {
  matcher: ['/projects/create'],
}; 