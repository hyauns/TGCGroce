import * as Sentry from "@sentry/nextjs"

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,

    tracesSampleRate: 1.0,

    tracePropagationTargets: ["localhost", /^https:\/\/tcglore\.com/, /^https:\/\/.*\.vercel\.app/],

    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  })
}
