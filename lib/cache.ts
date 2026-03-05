/**
 * In-memory cache utility for API responses
 * Supports TTL-based expiration and cache invalidation
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

class InMemoryCache {
  private cache = new Map<string, CacheEntry<any>>();
  private timers = new Map<string, NodeJS.Timeout>();

  /**
   * Get a value from cache if it exists and hasn't expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (entry.expiresAt < Date.now()) {
      this.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Set a value in cache with TTL
   * @param key Cache key
   * @param data Data to cache
   * @param ttlSeconds Time-to-live in seconds (default: 300s = 5 minutes)
   */
  set<T>(key: string, data: T, ttlSeconds: number = 300): void {
    // Clear any existing timer for this key
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key)!);
    }

    // Add data to cache
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });

    // Set auto-delete timer
    const timer = setTimeout(() => {
      this.delete(key);
    }, ttlSeconds * 1000);

    this.timers.set(key, timer);
  }

  /**
   * Delete a specific cache entry
   */
  delete(key: string): boolean {
    // Clear timer if it exists
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key)!);
      this.timers.delete(key);
    }

    return this.cache.delete(key);
  }

  /**
   * Clear all cache entries that match a pattern
   * Useful for cache invalidation on data mutations
   */
  deletePattern(pattern: string | RegExp): number {
    const regex = typeof pattern === "string" ? new RegExp(pattern) : pattern;
    let count = 0;

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.delete(key);
        count++;
      }
    }

    return count;
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    this.cache.clear();
    this.timers.clear();
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys()).map(key => ({
        key,
        expiresIn: Math.max(0, (this.cache.get(key)!.expiresAt - Date.now()) / 1000),
      })),
    };
  }
}

// Export singleton instance
export const cache = new InMemoryCache();

/**
 * Decorator-style cache wrapper for GET endpoints
 * Usage: const data = await cachedQuery('key', () => expensiveQuery(), 300);
 */
export async function cachedQuery<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttlSeconds: number = 300
): Promise<T> {
  // Try to get from cache first
  const cached = cache.get<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Fetch fresh data
  const data = await fetchFn();

  // Store in cache
  cache.set(key, data, ttlSeconds);

  return data;
}

/**
 * Cache key generators for common queries
 */
export const cacheKeys = {
  // Department cache keys
  departmentColleagues: (departmentId: number) => `dept:colleagues:${departmentId}`,
  departmentUsers: (departmentId: number) => `dept:users:${departmentId}`,
  allDepartments: () => "dept:all",

  // User cache keys
  userSubmissions: (userId: number) => `user:submissions:${userId}`,
  userObservations: (userId: number) => `user:observations:${userId}`,
  userNotifications: (userId: number) => `user:notifications:${userId}`,
  userResources: (userId: number) => `user:resources:${userId}`,

  // Submission cache keys
  submissionsByDeadline: (deadlineId: number) => `submissions:deadline:${deadlineId}`,
  allSubmissions: () => "submissions:all",

  // Observation cache keys
  observationsByLecturer: (lecturerId: number) => `observations:lecturer:${lecturerId}`,
  observationsByObserver: (observerId: number) => `observations:observer:${observerId}`,

  // Analytics cache keys
  adminAnalytics: () => "analytics:admin",
  complianceMetrics: () => "compliance:metrics",

  // Audit log cache keys
  auditLogs: () => "audit:logs",
};

/**
 * Pattern-based cache invalidation
 */
export const invalidateCache = {
  // Invalidate all department-related caches
  department: (departmentId?: number) => {
    if (departmentId) {
      cache.delete(cacheKeys.departmentColleagues(departmentId));
      cache.delete(cacheKeys.departmentUsers(departmentId));
    } else {
      cache.deletePattern(/^dept:/);
    }
  },

  // Invalidate all user-related caches
  user: (userId?: number) => {
    if (userId) {
      cache.delete(cacheKeys.userSubmissions(userId));
      cache.delete(cacheKeys.userObservations(userId));
      cache.delete(cacheKeys.userNotifications(userId));
      cache.delete(cacheKeys.userResources(userId));
    } else {
      cache.deletePattern(/^user:/);
    }
  },

  // Invalidate all submission-related caches
  submissions: (deadlineId?: number) => {
    if (deadlineId) {
      cache.delete(cacheKeys.submissionsByDeadline(deadlineId));
    }
    cache.delete(cacheKeys.allSubmissions());
  },

  // Invalidate all observation-related caches
  observations: () => {
    cache.deletePattern(/^observations:/);
  },

  // Invalidate all analytics caches
  analytics: () => {
    cache.delete(cacheKeys.adminAnalytics());
    cache.delete(cacheKeys.complianceMetrics());
  },

  // Invalidate audit logs
  auditLogs: () => {
    cache.delete(cacheKeys.auditLogs());
  },

  // Clear everything
  all: () => {
    cache.clear();
  },
};
