/**
 * Rate Limiting Utility for Next.js API Routes
 * Provides IP-based request throttling with configurable windows and limits
 * Suitable for brute-force protection and API abuse prevention
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds (e.g., 15 * 60 * 1000 for 15 min)
  maxRequests: number; // Max requests per window
  message?: string; // Custom error message
  keyGenerator?: (identifier: string) => string; // Custom key formatter
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number; // Seconds to wait before retry
}

interface StorageEntry {
  [key: string]: RateLimitEntry;
}

/**
 * In-memory rate limiter using IP-based tracking
 * Automatically cleans up expired entries
 */
class RateLimiter {
  private storage: StorageEntry = {};
  private config: RateLimitConfig;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(config: RateLimitConfig) {
    this.config = {
      windowMs: config.windowMs,
      maxRequests: config.maxRequests,
      message: config.message || 'Too many requests, please try again later',
      keyGenerator: config.keyGenerator || ((id) => id),
    };

    // Auto-cleanup every minute to free memory
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
  }

  /**
   * Check if a request is allowed
   * @param identifier - Either IP address or user ID
   * @returns Rate limit result with allowed status and remaining requests
   */
  check(identifier: string): RateLimitResult {
    const key = this.config.keyGenerator!(identifier);
    const now = Date.now();
    const entry = this.storage[key];

    // First request or window expired
    if (!entry || now > entry.resetTime) {
      this.storage[key] = {
        count: 1,
        resetTime: now + this.config.windowMs,
      };
      return {
        allowed: true,
        remaining: this.config.maxRequests - 1,
        resetTime: this.storage[key].resetTime,
      };
    }

    // Within existing window
    entry.count++;
    const remaining = Math.max(0, this.config.maxRequests - entry.count);
    const allowed = entry.count <= this.config.maxRequests;

    if (!allowed) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime,
        retryAfter: Math.ceil((entry.resetTime - now) / 1000),
      };
    }

    return {
      allowed: true,
      remaining,
      resetTime: entry.resetTime,
    };
  }

  /**
   * Get current status for an identifier
   */
  getStatus(identifier: string): RateLimitResult | null {
    const key = this.config.keyGenerator!(identifier);
    const now = Date.now();
    const entry = this.storage[key];

    if (!entry || now > entry.resetTime) {
      return null;
    }

    const remaining = Math.max(0, this.config.maxRequests - entry.count);
    return {
      allowed: entry.count <= this.config.maxRequests,
      remaining,
      resetTime: entry.resetTime,
    };
  }

  /**
   * Reset rate limit for an identifier (admin only)
   */
  reset(identifier: string): void {
    const key = this.config.keyGenerator!(identifier);
    delete this.storage[key];
  }

  /**
   * Reset all rate limits
   */
  resetAll(): void {
    this.storage = {};
  }

  /**
   * Clean up expired entries to free memory
   */
  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const key in this.storage) {
      if (this.storage[key].resetTime < now) {
        delete this.storage[key];
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.debug(`[RateLimit] Cleaned ${cleaned} expired entries`);
    }
  }

  /**
   * Get statistics (for debugging)
   */
  getStats(): { activeKeys: number; totalRequests: number } {
    const now = Date.now();
    let activeKeys = 0;
    let totalRequests = 0;

    for (const key in this.storage) {
      if (this.storage[key].resetTime > now) {
        activeKeys++;
        totalRequests += this.storage[key].count;
      }
    }

    return { activeKeys, totalRequests };
  }

  /**
   * Graceful shutdown
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

/**
 * Predefined rate limiters for common endpoints
 */
const rateLimiters = {
  // Strict: 5 attempts per 15 minutes (brute force protection)
  login: new RateLimiter({
    windowMs: 15 * 60 * 1000,
    maxRequests: 5,
    message: 'Too many login attempts. Please try again after 15 minutes.',
  }),

  // Strict: 3 attempts per 30 minutes (password reset spam prevention)
  passwordReset: new RateLimiter({
    windowMs: 30 * 60 * 1000,
    maxRequests: 3,
    message: 'Too many password reset requests. Please try again after 30 minutes.',
  }),

  // Moderate: 20 requests per 15 minutes (general API endpoint)
  general: new RateLimiter({
    windowMs: 15 * 60 * 1000,
    maxRequests: 20,
    message: 'Rate limit exceeded. Please try again later.',
  }),

  // Lenient: 100 requests per 15 minutes (file uploads, searches)
  lenient: new RateLimiter({
    windowMs: 15 * 60 * 1000,
    maxRequests: 100,
    message: 'Rate limit exceeded. Please try again later.',
  }),
};

/**
 * Helper to extract client IP from request
 * Handles proxies and load balancers
 */
function getClientIp(req: Request | { headers: Headers }): string {
  // Handle both Next.js Request objects and header objects
  const headers = req instanceof Request ? req.headers : req.headers;

  // Check common forwarding headers (in order of priority)
  const forwardedFor = headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  const realIp = headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  const cfConnectingIp = headers.get('cf-connecting-ip');
  if (cfConnectingIp) {
    return cfConnectingIp;
  }

  // Fallback: use a generic identifier for local development
  return headers.get('x-client-ip') || 'unknown';
}

/**
 * Middleware helper for Next.js API routes
 * Usage:
 *   const result = checkRateLimit(request, 'login');
 *   if (!result.allowed) {
 *     return new Response('Too many attempts', { status: 429, headers: {
 *       'Retry-After': result.retryAfter?.toString() || '60'
 *     }});
 *   }
 */
function checkRateLimit(
  req: Request | { headers: Headers },
  limiterKey: keyof typeof rateLimiters = 'general'
): RateLimitResult {
  const clientIp = getClientIp(req);
  const limiter = rateLimiters[limiterKey];

  if (!limiter) {
    console.warn(`[RateLimit] Unknown limiter key: ${limiterKey}`);
    return { allowed: true, remaining: -1, resetTime: 0 };
  }

  return limiter.check(clientIp);
}

/**
 * Export for use in API routes
 */
export type { RateLimitConfig, RateLimitResult };
export {
  RateLimiter,
  rateLimiters,
  getClientIp,
  checkRateLimit,
};
