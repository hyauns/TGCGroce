import type { Metadata } from "next"
import { getFeaturedProducts, getBestSellingProducts, getPreOrderProducts } from "@/lib/products"
import { getAllReviews } from "@/lib/reviews"
import { getSiteSettings } from "@/lib/site-settings"
import HomePageClient from "./page-client"
import { siteUrl } from "@/lib/site-config"

// ============================================================
// SEO Metadata
// ============================================================

export const metadata: Metadata = {
  title: "TCG Lore Operated by A TOY HAULERZ LLC Company | Premium Trading Cards & Collectibles Store",
  description:
    "Shop authentic Magic: The Gathering, Pokemon, Yu-Gi-Oh!, Disney Lorcana, and One Piece trading cards. Booster packs, booster boxes, and sealed product. Free shipping on US orders over $75.",
  keywords:
    "trading cards, TCG, Magic The Gathering, Pokemon cards, Yu-Gi-Oh, Disney Lorcana, One Piece Card Game, booster packs, booster boxes, collectible cards, card shop, TCG Lore Operated by A TOY HAULERZ LLC Company",
  alternates: { canonical: siteUrl },
  openGraph: {
    title: "TCG Lore Operated by A TOY HAULERZ LLC Company | Premium Trading Cards & Collectibles Store",
    description:
      "Authentic trading cards from your favourite TCG brands. Magic, Pokemon, Yu-Gi-Oh!, Lorcana & more. Fast US shipping.",
    url: siteUrl,
    siteName: "TCG Lore Operated by A TOY HAULERZ LLC Company.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "TCG Lore Operated by A TOY HAULERZ LLC Company | Premium Trading Cards & Collectibles Store",
    description: "Authentic trading cards from your favourite TCG brands.",
  },
}

// ============================================================
// Server Component — fetches all data on the server then
// passes it to the Client Component as serialisable props.
// DATABASE_URL is only read on the server; never exposed to
// the browser. Resolves the "No database connection string"
// console error caused by the previous useEffect approach.
// ============================================================

export const dynamic = "force-dynamic"

export default async function HomePage() {
  // All 5 fetches run in parallel on the server
  const [featuredProducts, bestSellingProducts, preOrderProducts, initialReviews, siteSettings] =
    await Promise.all([
      getFeaturedProducts(),
      getBestSellingProducts(),
      getPreOrderProducts(),
      getAllReviews(),
      getSiteSettings(),
    ])

  return (
    <HomePageClient
      featuredProducts={featuredProducts}
      bestSellingProducts={bestSellingProducts}
      preOrderProducts={preOrderProducts}
      initialReviews={initialReviews}
      heroSettings={siteSettings}
    />
  )
}

