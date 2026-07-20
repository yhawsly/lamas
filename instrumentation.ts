export async function register() {
    if (process.env.NEXT_RUNTIME === "nodejs") {
        const { startCronJobs } = await import("./lib/cron");
        startCronJobs();

        // Initialize Sentry error tracking (no-op if SENTRY_DSN is not set)
        const { initSentry } = await import("./lib/sentry");
        await initSentry();
    }
}
