import * as Sentry from "@sentry/nextjs";

Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || "",

    // Performance Monitoring
    tracesSampleRate: 0.1, // 10% of transactions

    // Session Replay (optional)
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,

    // Only enable in production
    enabled: process.env.NODE_ENV === "production",

    // Environment
    environment: process.env.NODE_ENV,

    // Ignore common errors
    ignoreErrors: [
        "ResizeObserver loop",
        "Non-Error promise rejection",
        "Network request failed",
    ],
});
