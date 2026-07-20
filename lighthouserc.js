module.exports = {
    ci: {
        collect: {
            // Start the production server for auditing
            startServerCommand: "npm run start",
            startServerReadyPattern: "Ready",
            startServerReadyTimeout: 30000,
            url: [
                "http://localhost:3000/login",
            ],
            numberOfRuns: 3,
            settings: {
                preset: "desktop",
                // Throttle to simulate real-world conditions
                throttlingMethod: "simulate",
            },
        },
        assert: {
            assertions: {
                "categories:performance": ["warn", { minScore: 0.7 }],
                "categories:accessibility": ["error", { minScore: 0.9 }],
                "categories:best-practices": ["warn", { minScore: 0.8 }],
                "categories:seo": ["warn", { minScore: 0.8 }],
                // Core Web Vitals budgets
                "first-contentful-paint": ["warn", { maxNumericValue: 2000 }],
                "largest-contentful-paint": ["warn", { maxNumericValue: 3000 }],
                "total-blocking-time": ["warn", { maxNumericValue: 300 }],
                "cumulative-layout-shift": ["warn", { maxNumericValue: 0.1 }],
            },
        },
        upload: {
            // Store results locally (no external server)
            target: "temporary-public-storage",
        },
    },
};
