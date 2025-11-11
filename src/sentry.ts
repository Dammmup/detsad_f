import * as Sentry from '@sentry/react';

// Инициализируем Sentry только если есть DSN
const SENTRY_DSN =
  process.env.REACT_APP_SENTRY_DSN ||
  'https://640eee1a96d83f6f600cb3b4ce5d749e@o4510119640498177.ingest.us.sentry.io/4510166458236928';

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    tracesSampleRate: 1.0, // 100% транзакций для трассировки
  });

  console.log('✅ Sentry initialized successfully');
} else {
  console.log('⚠️ Sentry DSN not provided, skipping initialization');
}

export default Sentry;
