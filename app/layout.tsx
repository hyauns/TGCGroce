import type React from "react"
import type { Metadata } from "next"
import ClientRootLayout from "./client-layout"
import "./globals.css"
import { Analytics } from "@vercel/analytics/react"
import { SpeedInsights } from "@vercel/speed-insights/next"

export const metadata: Metadata = {
  title: "TGC Lore Inc. - Premium Trading Cards, Booster Packs & Collectibles | Authentic TCG Products",
  description:
    "Shop authentic trading cards, booster packs, and collectibles from Magic: The Gathering, Pokemon, Yu-Gi-Oh!, Disney Lorcana & more. Fast shipping, guaranteed authenticity, competitive prices.",
  keywords: [
    "trading cards",
    "TCG",
    "collectibles",
    "booster packs",
    "card games",
    "Magic The Gathering",
    "Pokemon cards",
    "Yu-Gi-Oh cards",
    "Disney Lorcana",
    "One Piece Card Game",
    "Flesh and Blood",
    "authentic trading cards",
    "TCG store",
    "card shop",
    "collectible card games",
    "booster boxes",
    "pre-order cards",
    "rare cards",
    "mint condition cards",
    "sealed products",
  ].join(", "),
  authors: [{ name: "TGC Lore Inc.", url: "https://tcglore.com" }],
  creator: "TGC Lore Inc. - Premium Trading Card Games",
  publisher: "TGC Lore Inc.",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://tcglore.com"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "TGC Lore Inc. - Premium Trading Cards & Collectibles | Authentic Products",
    description:
      "Shop authentic trading cards from Magic: The Gathering, Pokemon, Yu-Gi-Oh! & more. Premium booster packs, rare collectibles, fast shipping & guaranteed authenticity.",
    url: "https://tcglore.com",
    siteName: "TGC Lore Inc. - Premium Trading Card Games",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "TGC Lore Inc. - Premium Trading Cards, Booster Packs and Collectibles",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "TGC Lore Inc. - Premium Trading Cards & Collectibles",
    description:
      "Shop authentic Magic: The Gathering, Pokemon, Yu-Gi-Oh! cards & more. Premium booster packs, rare collectibles, fast shipping & guaranteed authenticity.",
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
    google: "google-site-verification-code",
    yandex: "yandex-verification-code",
    yahoo: "yahoo-site-verification-code",
    other: {
      bing: "bing-verification-code",
    },
  },
  category: "E-commerce",
  classification: "Trading Card Games Store",
  other: {
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
    "apple-mobile-web-app-title": "TGC Lore Inc.",
    "mobile-web-app-capable": "yes",
    "msapplication-TileColor": "#2563eb",
    "theme-color": "#2563eb",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClientRootLayout>
      {children}
      <Analytics />
      <SpeedInsights />
    </ClientRootLayout>
  )
}
