# Tracker Audit Report

## Audit Scope
Searched the Next.js codebase for instances of third-party tracking, analytics, and marketing pixels.

## Findings & Classifications

### 1. Strictly Necessary
- **Stripe (`@stripe/react-stripe-js` / `https://js.stripe.com/v3/`)**: Required for secure payment processing during checkout.
- **Cloudflare Turnstile (`https://challenges.cloudflare.com/turnstile/v0/api.js`)**: Required for bot protection and spam prevention on contact forms.

### 2. Analytics (Requires Consent)
- **Vercel Analytics (`@vercel/analytics/react`)**: Used globally in `app/layout.tsx` to track visitor page views and audience metrics.
- **Vercel Speed Insights (`@vercel/speed-insights/next`)**: Used globally in `app/layout.tsx` to track core web vitals and performance metrics from real users.
- **Custom Internal Analytics (`hooks/use-analytics.ts`)**: Generates a `sessionStorage` token (`_tgc_sid`) to track page views, product views, add-to-carts, and purchases, sending payloads to `/api/analytics`.

### 3. Functional / Third-Party Widgets (Requires Consent if setting cookies)
- **Trustpilot Widget (`https://widget.trustpilot.com/bootstrap/v5/tp.widget.bootstrap.min.js`)**: Used in `app/components/trustpilot-widget.tsx` to display store reviews.
- **Google Maps Places API (`https://maps.googleapis.com/maps/api/js`)**: Used in `app/checkout/page.tsx` for address autocomplete during checkout.

### 4. Marketing / Ads
- *None detected.* (No Meta Pixel, Google Ads, TikTok Pixel, or Pinterest Tags were found in the codebase).

## Action Plan
- A unified Cookie Consent Banner will be introduced.
- **Vercel Analytics** and **Speed Insights** will be conditionally rendered only if the user grants `analytics` consent.
- **Custom Internal Analytics** (`useAnalytics`) will be disabled (or blocked from generating the session ID / firing events) until `analytics` consent is granted.
- **Trustpilot Widget** will be delayed until `functional` (or `marketing`) consent is granted, as third-party widgets typically drop tracking cookies.
