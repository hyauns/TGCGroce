import "@/lib/env" // Fail-fast env validation — must be first import
import type React from "react"
import type { Metadata } from "next"
import ClientRootLayout from "./client-layout"
import "./globals.css"
import { Analytics } from "@vercel/analytics/react"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { siteUrl } from "@/lib/site-config"
import { getSiteSettings } from "@/lib/site-settings"
import { neon } from "@neondatabase/serverless"

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings()

  return {
  title: settings.seoTitle || "TCG Lore Operated by A TOY HAULERZ LLC Company - Premium Trading Cards, Booster Packs & Collectibles | Authentic TCG Products",
  description: settings.seoDescription || "Shop authentic trading cards, booster packs, and collectibles from Magic: The Gathering, Pokemon, Yu-Gi-Oh!, Disney Lorcana & more. Fast shipping, guaranteed authenticity, competitive prices.",
  keywords: settings.seoKeywords || [
    "trading cards", "TCG", "collectibles", "booster packs", "card games",
    "Magic The Gathering", "Pokemon cards", "Yu-Gi-Oh cards", "Disney Lorcana",
    "One Piece Card Game", "Flesh and Blood", "authentic trading cards",
    "TCG store", "card shop", "collectible card games", "booster boxes",
    "pre-order cards", "rare cards", "mint condition cards", "sealed products"
  ].join(", "),
  authors: [{ name: "TOY HAULERZ LLC", url: siteUrl }],
  creator: "TCG Lore Operated by A TOY HAULERZ LLC Company - Premium Trading Card Games",
  publisher: "TOY HAULERZ LLC",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(siteUrl),
  openGraph: {
    title: settings.seoTitle || "TCG Lore Operated by A TOY HAULERZ LLC Company - Premium Trading Cards & Collectibles | Authentic Products",
    description: settings.seoDescription || "Shop authentic trading cards from Magic: The Gathering, Pokemon, Yu-Gi-Oh! & more. Premium booster packs, rare collectibles, fast shipping & guaranteed authenticity.",
    url: siteUrl,
    siteName: "TCG Lore Operated by A TOY HAULERZ LLC Company - Premium Trading Card Games",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "TCG Lore Operated by A TOY HAULERZ LLC Company - Premium Trading Cards, Booster Packs and Collectibles",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: settings.seoTitle || "TCG Lore Operated by A TOY HAULERZ LLC Company - Premium Trading Cards & Collectibles",
    description: settings.seoDescription || "Shop authentic Magic: The Gathering, Pokemon, Yu-Gi-Oh! cards & more. Premium booster packs, rare collectibles, fast shipping & guaranteed authenticity.",
    images: ["/og-image.jpg"],
    creator: "@tcglore",
    site: "@tcglore",
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    ...(settings.googleSiteVerification ? { google: settings.googleSiteVerification } : {}),
  },
  icons: {
    icon: settings.faviconUrl || "/favicon.ico",
  },
  category: "E-commerce",
  classification: "Trading Card Games Store",
  other: {
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
    "apple-mobile-web-app-title": "TCG Lore Operated by A TOY HAULERZ LLC Company",
    "mobile-web-app-capable": "yes",
    "msapplication-TileColor": "#2563eb",
    "theme-color": "#2563eb",
  },
}
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const sql = neon(process.env.DATABASE_URL!)
  const dbCategories = await sql`SELECT name, slug FROM product_categories WHERE is_active = true ORDER BY display_order ASC`
  const categories = dbCategories.map((c: any) => ({ name: c.name, slug: c.slug }))
  const orgSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "TOY HAULERZ LLC",
    "alternateName": "TCG Lore Operated by A TOY HAULERZ LLC Company",
    "url": siteUrl,
    "logo": `${siteUrl}/logo.png`,
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+1-303-668-3245",
      "contactType": "customer service",
      "email": "cs@tcglore.com",
      "availableLanguage": ["English"]
    },
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "1757 NORTH CENTRAL AVENUE",
      "addressLocality": "FLAGLER BEACH",
      "addressRegion": "FL",
      "postalCode": "32136",
      "addressCountry": "US"
    }
  }

  const webSiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "TCG Lore Operated by A TOY HAULERZ LLC Company",
    "url": siteUrl,
    "potentialAction": {
      "@type": "SearchAction",
      "target": `${siteUrl}/products?search={search_term_string}`,
      "query-input": "required name=search_term_string"
    }
  }

  return (
    <ClientRootLayout categories={categories}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteSchema) }}
      />
      {children}
      <Analytics />
      <SpeedInsights />
    </ClientRootLayout>
  )
}

