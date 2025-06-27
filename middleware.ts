import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/middleware';

// Publicly accessible path without any restrictions
const ALWAYS_PUBLIC_PATHS = [
  '/'  // Home page
];

// Auth-specific paths that need special handling
const AUTH_PATHS = [
  '/auth/reset-password',            // Reset password page (should have token parameters)
  '/auth/auth-code-error',      // Auth code error page (redirected to by system)
  '/auth/confirm',               // Email confirmation page (should have token parameters)
  '/complete-profile'            // Main complete profile page
];

export async function middleware(req: NextRequest) {
  // Get the pathname of the request and search params
  const path = req.nextUrl.pathname;
  const searchParams = req.nextUrl.searchParams;
  
  // Create client and get response
  const { response, supabase } = createClient(req);
  
  // Always allow access to public paths
  if (ALWAYS_PUBLIC_PATHS.includes(path)) {
    return response;
  }
  
  // Special handling for auth-related paths
  if (AUTH_PATHS.some(authPath => path === authPath || path.startsWith(authPath + '/'))) {
    if (path === '/auth/reset-password' || path === '/auth/confirm') {
      // Check for required parameters that indicate coming from a Supabase email
      const hasAuthParams = searchParams.has('token_hash') || 
                           searchParams.has('error_code') || 
                           searchParams.has('error') ||
                           searchParams.has('type');
      
      if (!hasAuthParams) {
        // If missing auth parameters, redirect to home
        return NextResponse.redirect(new URL('/', req.url));
      }
    }
    
    // Allow access to auth paths with proper parameters
    return response;
  }
  
  // For protected routes, check if user is authenticated
  const {
    data: { session },
  } = await supabase.auth.getSession();
  // If there's no session and the user is trying to access a protected route, redirect to home
  if (!session && 
      !ALWAYS_PUBLIC_PATHS.includes(path) && 
      !AUTH_PATHS.some(authPath => path === authPath || path.startsWith(authPath + '/'))) {
    return NextResponse.redirect(new URL('/', req.url));
  }
  
  // Otherwise, continue with the response
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
};
