import * as Sentry from '@sentry/react';

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    tracesSampleRate: parseFloat(import.meta.env.VITE_SENTRY_TRACES_RATE || '0.1'),
  });
}

export default Sentry;
