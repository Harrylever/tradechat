// Import with `const Sentry = require("@sentry/nestjs");` if you are using CJS
import 'dotenv/config';
import * as Sentry from '@sentry/nestjs';

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    dataCollection: {
      // userInfo: false,
      // httpBodies: [],
    },
  });
} else {
  console.warn('[Sentry] SENTRY_DSN not found. Sentry initialization skipped.');
}
