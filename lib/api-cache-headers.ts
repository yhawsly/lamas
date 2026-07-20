/**
 * Standardized Cache-Control header utilities for API routes.
 *
 * Usage:
 *   return NextResponse.json(data, { headers: privateCacheHeaders() });
 *   return NextResponse.json(data, { headers: publicCacheHeaders(120) });
 */

/**
 * Cache headers for user-specific/private data.
 * Prevents shared caches (CDNs) from storing the response,
 * but allows the browser to cache for the specified duration.
 */
export function privateCacheHeaders(maxAge: number = 0, staleWhileRevalidate: number = 30): HeadersInit {
    return {
        "Cache-Control": `private, max-age=${maxAge}, stale-while-revalidate=${staleWhileRevalidate}`,
    };
}

/**
 * Cache headers for shared/public data (e.g., shared resource listings).
 * Both the browser and CDN/reverse-proxy can cache the response.
 */
export function publicCacheHeaders(
    maxAge: number = 60,
    sMaxAge: number = 120,
    staleWhileRevalidate: number = 60
): HeadersInit {
    return {
        "Cache-Control": `public, max-age=${maxAge}, s-maxage=${sMaxAge}, stale-while-revalidate=${staleWhileRevalidate}`,
    };
}

/**
 * No-cache headers for sensitive or mutation-adjacent data.
 */
export function noCacheHeaders(): HeadersInit {
    return {
        "Cache-Control": "no-store, no-cache, must-revalidate",
    };
}
