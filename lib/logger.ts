/**
 * Structured logger for server-side use.
 *
 * - Production: JSON output for log aggregation (Datadog, CloudWatch, etc.)
 * - Development: Human-readable coloured output
 */

type LogLevel = "debug" | "info" | "warn" | "error";

const LOG_LEVELS: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
};

const currentLevel: LogLevel = (process.env.LOG_LEVEL as LogLevel) || "info";
const isProd = process.env.NODE_ENV === "production";

interface LogContext {
    requestId?: string;
    userId?: number | string;
    method?: string;
    path?: string;
    statusCode?: number;
    durationMs?: number;
    [key: string]: unknown;
}

function shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[currentLevel];
}

function formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    if (isProd) {
        // Structured JSON for production log aggregation
        return JSON.stringify({
            timestamp: new Date().toISOString(),
            level,
            message,
            ...context,
        });
    }

    // Human-readable for development
    const colors: Record<LogLevel, string> = {
        debug: "\x1b[36m", // Cyan
        info: "\x1b[32m",  // Green
        warn: "\x1b[33m",  // Yellow
        error: "\x1b[31m", // Red
    };
    const reset = "\x1b[0m";
    const timestamp = new Date().toISOString().substring(11, 23);
    const ctx = context ? ` ${JSON.stringify(context)}` : "";
    return `${colors[level]}[${level.toUpperCase()}]${reset} ${timestamp} ${message}${ctx}`;
}

export const logger = {
    debug(message: string, context?: LogContext) {
        if (shouldLog("debug")) console.debug(formatMessage("debug", message, context));
    },

    info(message: string, context?: LogContext) {
        if (shouldLog("info")) console.log(formatMessage("info", message, context));
    },

    warn(message: string, context?: LogContext) {
        if (shouldLog("warn")) console.warn(formatMessage("warn", message, context));
    },

    error(message: string, context?: LogContext & { error?: unknown }) {
        if (shouldLog("error")) {
            const { error: err, ...rest } = context || {};
            const errorDetail = err instanceof Error
                ? { errorName: err.name, errorMessage: err.message, stack: isProd ? undefined : err.stack }
                : err ? { errorDetail: String(err) } : {};
            console.error(formatMessage("error", message, { ...rest, ...errorDetail }));
        }
    },

    /**
     * Create a timer for measuring operation duration.
     * Usage:
     *   const timer = logger.startTimer();
     *   // ... do work ...
     *   timer.done("Operation completed", { path: "/api/foo" });
     */
    startTimer() {
        const start = performance.now();
        return {
            done(message: string, context?: LogContext) {
                const durationMs = Math.round(performance.now() - start);
                logger.info(message, { ...context, durationMs });
            },
        };
    },
};
