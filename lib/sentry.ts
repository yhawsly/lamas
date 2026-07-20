/**
 * Sentry error tracking integration.
 *
 * Gated on the SENTRY_DSN env var — if not set, all exports are no-ops.
 * This allows the codebase to reference Sentry helpers without requiring
 * Sentry to be installed until a DSN is provided.
 */

let sentryModule: any = null;
let initialized = false;

/**
 * Initialize Sentry. Call once from instrumentation.ts register().
 */
export async function initSentry() {
    const dsn = process.env.SENTRY_DSN;
    if (!dsn || initialized) return;

    try {
        // Dynamic import so Sentry is not bundled unless DSN is configured
        sentryModule = await import("@sentry/nextjs");
        sentryModule.init({
            dsn,
            tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
            environment: process.env.NODE_ENV || "development",
            beforeSend(event: any) {
                // Scrub sensitive data
                if (event.request?.headers) {
                    delete event.request.headers["authorization"];
                    delete event.request.headers["cookie"];
                }
                return event;
            },
        });
        initialized = true;
        console.log("✅ Sentry initialized");
    } catch {
        // @sentry/nextjs not installed — Sentry is a no-op
        console.log("ℹ️  Sentry SDK not installed, error tracking disabled. Install @sentry/nextjs to enable.");
    }
}

/**
 * Capture an exception in Sentry if available.
 */
export function captureException(error: unknown, context?: Record<string, any>) {
    if (sentryModule) {
        sentryModule.captureException(error, {
            extra: context,
        });
    }
}

/**
 * Capture a message in Sentry if available.
 */
export function captureMessage(message: string, level: "info" | "warning" | "error" = "info") {
    if (sentryModule) {
        sentryModule.captureMessage(message, level);
    }
}
