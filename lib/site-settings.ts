import { neon } from "@neondatabase/serverless"

export interface SiteSettings {
  heroTitle: string
  heroSubtitle: string
  heroImageUrl: string | null
  logoUrl: string | null
  faviconUrl: string | null
  seoTitle: string | null
  seoDescription: string | null
  seoKeywords: string | null
  googleSiteVerification: string | null
  socialFacebook: string | null
  socialInstagram: string | null
  socialPinterest: string | null
  socialTwitter: string | null
  socialYoutube: string | null
}

const DEFAULTS: SiteSettings = {
  heroTitle: "Premium Trading Cards & Collectibles Store",
  heroSubtitle:
    "Discover authentic Magic: The Gathering, Pokemon, Yu-Gi-Oh! cards and rare collectibles. Build legendary decks with guaranteed authentic trading card games from the most trusted TCG store.",
  heroImageUrl: null,
  logoUrl: null,
  faviconUrl: null,
  seoTitle: null,
  seoDescription: null,
  seoKeywords: null,
  googleSiteVerification: null,
  socialFacebook: null,
  socialInstagram: null,
  socialPinterest: null,
  socialTwitter: null,
  socialYoutube: null,
}

export async function getSiteSettings(): Promise<SiteSettings> {
  try {
    const sql = neon(process.env.DATABASE_URL!)
    const rows = await sql`SELECT * FROM site_settings WHERE id = 1`
    const row = rows[0]

    if (!row) return DEFAULTS

    return {
      heroTitle: row.hero_title || DEFAULTS.heroTitle,
      heroSubtitle: row.hero_subtitle || DEFAULTS.heroSubtitle,
      heroImageUrl: row.hero_image_url || null,
      logoUrl: row.logo_url || null,
      faviconUrl: row.favicon_url || null,
      seoTitle: row.seo_title || null,
      seoDescription: row.seo_description || null,
      seoKeywords: row.seo_keywords || null,
      googleSiteVerification: row.google_site_verification || null,
      socialFacebook: row.social_facebook || null,
      socialInstagram: row.social_instagram || null,
      socialPinterest: row.social_pinterest || null,
      socialTwitter: row.social_twitter || null,
      socialYoutube: row.social_youtube || null,
    }
  } catch (error) {
    console.error("Failed to fetch site settings:", error)
    return DEFAULTS
  }
}
