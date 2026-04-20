import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

export async function GET() {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    const settingsRows = await sql`SELECT * FROM site_settings WHERE id = 1`;
    let settings = settingsRows[0];

    if (!settings) {
      settings = {
        id: 1,
        hero_title: "Premium Trading Cards & Collectibles Store",
        hero_subtitle: "Discover authentic Magic: The Gathering, Pokemon, Yu-Gi-Oh! cards and rare collectibles. Build legendary decks with guaranteed authentic trading card games from the most trusted TCG store.",
        hero_image_url: null,
        logo_url: null,
        favicon_url: null,
        seo_title: null,
        seo_description: null,
        seo_keywords: null,
      };
    }

    // Convert to camelCase to match the frontend expectations
    return NextResponse.json({
      id: settings.id,
      heroTitle: settings.hero_title,
      heroSubtitle: settings.hero_subtitle,
      heroImageUrl: settings.hero_image_url,
      logoUrl: settings.logo_url,
      faviconUrl: settings.favicon_url,
      seoTitle: settings.seo_title,
      seoDescription: settings.seo_description,
      seoKeywords: settings.seo_keywords,
    });
  } catch (error: any) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: error?.message || 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    // Basic verification placeholder check
    // const user = await checkAdminSession(request);
    // if (!user) return NextResponse.json({ error: 'Not authorized' }, { status: 401 });

    const body = await request.json();
    const sql = neon(process.env.DATABASE_URL!);
    
    const heroTitle = body.heroTitle || "Premium Trading Cards & Collectibles Store";
    const heroSubtitle = body.heroSubtitle || "Discover authentic Magic: The Gathering, Pokemon, Yu-Gi-Oh! cards and rare collectibles. Build legendary decks with guaranteed authentic trading card games from the most trusted TCG store.";
    
    // Perform Upsert on Neon using raw SQL
    const updatedSettings = await sql`
      INSERT INTO site_settings (
        id, hero_title, hero_subtitle, hero_image_url, logo_url, favicon_url, seo_title, seo_description, seo_keywords
      )
      VALUES (
        1, ${heroTitle}, ${heroSubtitle}, ${body.heroImageUrl || null}, ${body.logoUrl || null}, ${body.faviconUrl || null}, ${body.seoTitle || null}, ${body.seoDescription || null}, ${body.seoKeywords || null}
      )
      ON CONFLICT (id) DO UPDATE SET
        hero_title = EXCLUDED.hero_title,
        hero_subtitle = EXCLUDED.hero_subtitle,
        hero_image_url = EXCLUDED.hero_image_url,
        logo_url = EXCLUDED.logo_url,
        favicon_url = EXCLUDED.favicon_url,
        seo_title = EXCLUDED.seo_title,
        seo_description = EXCLUDED.seo_description,
        seo_keywords = EXCLUDED.seo_keywords,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *;
    `;

    const settings = updatedSettings[0];

    return NextResponse.json({
      id: settings.id,
      heroTitle: settings.hero_title,
      heroSubtitle: settings.hero_subtitle,
      heroImageUrl: settings.hero_image_url,
      logoUrl: settings.logo_url,
      faviconUrl: settings.favicon_url,
      seoTitle: settings.seo_title,
      seoDescription: settings.seo_description,
      seoKeywords: settings.seo_keywords,
    });
  } catch (error: any) {
    console.error('Error updating settings:', error);
    return NextResponse.json({ error: error?.message || 'Failed to update settings' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  return PUT(request);
}
