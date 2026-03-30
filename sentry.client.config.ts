import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  tracesSampleRate: 1.0,

  tracePropagationTargets: ["localhost", /^https:\/\/tcgstore\.com/, /^https:\/\/v0-toy-gamma\.vercel\.app/],

  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
})
