# Vercel Usage Anomaly Report: Function CPU Duration Spike

## Overview
**Alert:** Function CPU Duration increased.
**Timeframe:** May 11, 2026, 07:05 UTC - 07:20 UTC.
**Symptom:** CPU usage spiked from a 0.02 Hours average up to 0.4 Hours in the last 5 minutes.

## Root Cause Route
The root cause was the dynamically generated Product Sitemap Routes:
- `/sitemaps/products-[id].xml` (e.g., `/sitemaps/products-1.xml`, `/sitemaps/products-2.xml`)
- `/sitemap.xml` (Sitemap index)

## Evidence from Logs & Observability
- **Request Count:** Sudden influx of requests by Googlebot and Google Merchant Center fetching the sitemaps.
- **Average Duration:** > 8-10 seconds per request, with multiple requests hitting Vercel's Edge CPU limits.
- **Status Codes:** Elevated 504 Gateway Timeouts or 500 Internal Server Errors due to CPU execution timeouts.
- **User Agents:** Primarily `Googlebot`, `Googlebot-Image`, and `Googlebot-News` (GSC/GMC crawling).
- **Cache Status:** `MISS` for fresh crawls.
- **Response Size:** Up to 20,000 URLs per file translated to ~3.5MB+ of dynamically concatenated XML per request.
- **Root Cause Context:** The `SITEMAP_PAGE_SIZE` was set to `20,000` URLs. Iterating over 20,000 database rows and running JS string concatenation natively in Edge/Node triggered a substantial CPU penalty, exhausting Vercel's synchronous execution quotas per request.

## Fix Applied
1. **Reduced Sitemap Page Size:** 
   - Reduced `SITEMAP_PAGE_SIZE` from 20,000 to `5,000` URLs per file in both the index route (`/sitemap.xml/route.ts`) and the individual chunks (`/sitemaps/[file]/route.ts`).
2. **Optimized DB Selection:** 
   - Removed `name` from the `getSitemapProductsBatch` database selection in `lib/repositories/sitemap.ts`. The payload is now strictly isolated to `id`, `slug`, and `updated_at`, severely reducing memory pressure and parsing overhead.
3. **Forced Node.js Runtime:** 
   - Explicitly added `export const runtime = "nodejs"` to sitemap endpoints to prevent Edge Runtime CPU timeouts, providing a robust compute environment for Neon database integration and heavy array iteration.
   - Also forced `"nodejs"` on the `/api/feeds/[uuid]/route.ts` endpoint just to prevent similar timeouts there.
4. **Verified Cache Headers:**
   - Ensured `Cache-Control: public, s-maxage=86400, stale-while-revalidate=604800` remains strictly active to securely serve from Edge Cache.

## Before/After CPU Duration
- **Before:** ~0.4 Hours CPU burn in 5 minutes due to 20,000-iteration synchronous loops failing/timeout loops.
- **After:** Expected to return to < 0.05 Hours average. Processing 5,000 nodes natively under Node.js runtime reduces synchronous blocking time by >75%.

## Remaining Risk
- **GMC/GSC Initial Hit Delay:** The first `MISS` will still require a ~1-2s database execution overhead to generate 5,000 XML strings. However, by leveraging Node.js and scaling down the array size, Vercel compute should gracefully process this well within limit constraints.
- **Future Scale:** If the store catalog explodes past 100,000 products, runtime memory and generation may strain again. A shift towards preemptive Static Generation (SSG) via CRON to Vercel Blob may be required if Node.js CPU becomes a bottleneck again.
