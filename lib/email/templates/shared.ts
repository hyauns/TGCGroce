import { siteUrl } from "@/lib/site-config"

/**
 * Returns the absolute URL for the site logo, suitable for use in emails.
 * Email clients require absolute URLs — relative paths won't work.
 */
export function getLogoUrl(): string {
  return `${getSiteUrl()}/logo.png`
}

/**
 * Returns the base site URL.
 */
export function getSiteUrl(): string {
  return siteUrl
}
