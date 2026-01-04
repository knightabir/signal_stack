/**
 * Simple in-memory rate limiter using token bucket algorithm
 * For production, consider using Redis or a dedicated rate limiting service
 */

// Store for rate limit data: { [key]: { tokens, lastRefill } }
const rateLimitStore = new Map();

// Clean up old entries every 5 minutes
const CLEANUP_INTERVAL = 5 * 60 * 1000;

// Default configuration
const DEFAULT_CONFIG = {
  maxTokens: 60,       // Maximum requests
  refillRate: 60,      // Tokens added per interval
  refillInterval: 60000, // 1 minute in ms
};

// Cleanup function to prevent memory leaks
function cleanup() {
  const now = Date.now();
  for (const [key, data] of rateLimitStore.entries()) {
    // Remove entries that haven't been accessed in 10 minutes
    if (now - data.lastAccess > 10 * 60 * 1000) {
      rateLimitStore.delete(key);
    }
  }
}

// Start cleanup interval
if (typeof setInterval !== 'undefined') {
  setInterval(cleanup, CLEANUP_INTERVAL);
}

/**
 * Rate limiter function
 * @param {string} key - Unique identifier (usually IP or user ID)
 * @param {Object} config - Rate limit configuration
 * @returns {Object} { success: boolean, remaining: number, reset: number }
 */
export function rateLimit(key, config = {}) {
  const { maxTokens, refillRate, refillInterval } = { ...DEFAULT_CONFIG, ...config };
  const now = Date.now();

  // Get or create rate limit data for this key
  let data = rateLimitStore.get(key);

  if (!data) {
    data = {
      tokens: maxTokens,
      lastRefill: now,
      lastAccess: now,
    };
    rateLimitStore.set(key, data);
  }

  // Calculate tokens to add based on time elapsed
  const timePassed = now - data.lastRefill;
  const tokensToAdd = Math.floor(timePassed / refillInterval) * refillRate;

  if (tokensToAdd > 0) {
    data.tokens = Math.min(maxTokens, data.tokens + tokensToAdd);
    data.lastRefill = now;
  }

  data.lastAccess = now;

  // Check if we have tokens available
  if (data.tokens > 0) {
    data.tokens--;
    return {
      success: true,
      remaining: data.tokens,
      reset: Math.ceil((refillInterval - (now - data.lastRefill)) / 1000),
    };
  }

  // Rate limit exceeded
  return {
    success: false,
    remaining: 0,
    reset: Math.ceil((refillInterval - (now - data.lastRefill)) / 1000),
  };
}

/**
 * Rate limit configurations for different endpoints
 */
export const RATE_LIMITS = {
  // Auth endpoints - more restrictive
  auth: {
    maxTokens: 10,
    refillRate: 10,
    refillInterval: 60000, // 10 requests per minute
  },
  // API endpoints - standard
  api: {
    maxTokens: 100,
    refillRate: 100,
    refillInterval: 60000, // 100 requests per minute
  },
  // Public endpoints - more permissive
  public: {
    maxTokens: 200,
    refillRate: 200,
    refillInterval: 60000, // 200 requests per minute
  },
};

/**
 * Get client IP from request headers
 * @param {Request} request - The incoming request
 * @returns {string} Client IP address
 */
export function getClientIP(request) {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  
  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }

  // Fallback for local development
  return '127.0.0.1';
}

/**
 * Apply rate limiting and return appropriate response if exceeded
 * @param {Request} request - The incoming request
 * @param {string} type - Rate limit type ('auth', 'api', 'public')
 * @returns {Response|null} Response if rate limited, null if allowed
 */
export function applyRateLimit(request, type = 'api') {
  const ip = getClientIP(request);
  const config = RATE_LIMITS[type] || RATE_LIMITS.api;
  const result = rateLimit(`${type}:${ip}`, config);

  if (!result.success) {
    return new Response(
      JSON.stringify({
        error: 'Too many requests',
        retryAfter: result.reset,
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': result.reset.toString(),
          'Retry-After': result.reset.toString(),
        },
      }
    );
  }

  return null;
}
