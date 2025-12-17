import * as Sentry from '@sentry/react';


const SENTRY_DSN =
  process.env.REACT_APP_SENTRY_DSN ||
  'https:

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    tracesSampleRate: 1.0,
  });

  console.log('✅ Sentry initialized successfully');
} else {
  console.log('⚠️ Sentry DSN not provided, skipping initialization');
}

export default Sentry;
