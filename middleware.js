import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Routes that don't require authentication
const publicRoutes = [
  '/',
  '/sign-in',
  '/sign-up',
  '/api/auth',
];

// Routes that are always public (like public feedback boards)
const publicPatterns = [
  /^\/p\/[^/]+$/, // Public workspace pages: /p/[slug]
  /^\/p\/[^/]+\/feedback$/,
  /^\/p\/[^/]+\/roadmap$/,
  /^\/p\/[^/]+\/changelog$/,
];

// API routes that allow anonymous access
const publicApiPatterns = [
  /^\/api\/public\//,
  /^\/api\/widget\//,
  /^\/api\/billing\/webhook$/, // Stripe webhook - no auth required
];

// Static files and Next.js internals
const ignoredPaths = [
  '/_next',
  '/favicon.ico',
  '/api/auth',
];

// Routes allowed during onboarding (before completion)
const onboardingAllowedPaths = [
  '/onboarding',
  '/api/onboarding',
  '/sign-in',
  '/sign-up',
];

/**
 * Check if the path matches any pattern
 */
function matchesPattern(path, patterns) {
  return patterns.some((pattern) => {
    if (typeof pattern === 'string') {
      return path === pattern || path.startsWith(pattern + '/');
    }
    return pattern.test(path);
  });
}

/**
 * Check if the path is public
 */
function isPublicPath(path) {
  // Check static paths
  if (publicRoutes.includes(path)) {
    return true;
  }

  // Check public patterns
  if (matchesPattern(path, publicPatterns)) {
    return true;
  }

  // Check public API patterns
  if (matchesPattern(path, publicApiPatterns)) {
    return true;
  }

  return false;
}

/**
 * Check if the path should be ignored
 */
function shouldIgnore(path) {
  return ignoredPaths.some((ignored) => path.startsWith(ignored));
}

/**
 * Check if path is allowed during onboarding
 */
function isOnboardingAllowed(path) {
  return onboardingAllowedPaths.some((allowed) => 
    path === allowed || path.startsWith(allowed + '/')
  );
}

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Ignore static files and Next.js internals
  if (shouldIgnore(pathname)) {
    return NextResponse.next();
  }

  // Allow public paths
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // Get JWT token
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // Redirect to sign-in if not authenticated
  if (!token) {
    const signInUrl = new URL('/sign-in', request.url);
    signInUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(signInUrl);
  }

  // Check if onboarding is completed
  if (!token.onboardingCompleted) {
    // Allow access to onboarding-related paths
    if (isOnboardingAllowed(pathname)) {
      return NextResponse.next();
    }

    // Redirect to onboarding
    return NextResponse.redirect(new URL('/onboarding', request.url));
  }

  // User completed onboarding but trying to access /onboarding
  if (pathname === '/onboarding') {
    // Redirect to their workspace if they have one
    if (token.defaultWorkspace?.slug) {
      return NextResponse.redirect(new URL(`/${token.defaultWorkspace.slug}`, request.url));
    }
    // This shouldn't happen, but fallback to home
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Check workspace access for workspace routes
  const workspaceMatch = pathname.match(/^\/([^/]+)(\/.*)?$/);
  if (workspaceMatch) {
    const potentialSlug = workspaceMatch[1];

    // Skip non-workspace routes
    const nonWorkspaceRoutes = ['sign-in', 'sign-up', 'onboarding', 'settings', 'api', 'p'];
    if (!nonWorkspaceRoutes.includes(potentialSlug)) {
      // Add workspace info to headers for API routes to use
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-workspace-slug', potentialSlug);
      requestHeaders.set('x-user-id', token.id);

      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};
