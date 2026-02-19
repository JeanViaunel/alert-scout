/**
 * Next.js Instrumentation
 * 
 * This file runs when the Next.js server starts.
 * Use it to initialize monitoring, database connections, etc.
 * 
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  // Only run on Node.js runtime (not edge)
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    console.log('🚀 Initializing server instrumentation...');
    
    // Initialize Sentry if configured
    if (process.env.SENTRY_DSN) {
      const { init } = await import('@sentry/nextjs');
      init({
        dsn: process.env.SENTRY_DSN,
        environment: process.env.VERCEL_ENV || process.env.NODE_ENV,
        tracesSampleRate: 1.0,
      });
      console.log('📊 Sentry initialized');
    }
    
    // Log environment info
    console.log({
      env: process.env.VERCEL_ENV || process.env.NODE_ENV,
      region: process.env.VERCEL_REGION,
      url: process.env.VERCEL_URL,
    });

    // Start the alert scheduler on server boot so alerts run on their
    // configured frequency (5min / 15min / 1hour / daily) without needing
    // an HTTP request to /api/queue to initialise it first.
    const { scheduleAlertChecks } = await import('./lib/queue');
    scheduleAlertChecks();
  }
}
