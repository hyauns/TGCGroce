import * as Sentry from "@sentry/nextjs"

export async function register() {
  if (!process.env.SENTRY_DSN) {
    // Sentry is not configured — skip initialization silently.
    return
  }

  const isProduction = process.env.NODE_ENV === "production"
  const sampleRate = isProduction ? 0.1 : 1.0

  if (process.env.NEXT_RUNTIME === "nodejs") {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,

      tracesSampleRate: sampleRate,

      tracePropagationTargets: [
        "localhost",
        /^https:\/\/tcglore\.com/,
        /^https:\/\/.*\.vercel\.app/,
      ],

      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,

      beforeSend(event) {
        if (process.env.NODE_ENV === "development") {
          console.error("[Sentry] Event captured:", event.exception?.values?.[0]?.value)
          return null
        }
        return event
      },
    })
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,

      tracesSampleRate: sampleRate,

      tracePropagationTargets: [
        "localhost",
        /^https:\/\/tcglore\.com/,
        /^https:\/\/.*\.vercel\.app/,
      ],
    })
  }
}
