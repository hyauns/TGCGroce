# TCG Lore - GMC Copy Cleanup Report

## Objective
The primary goal of this cleanup was to ensure TCG Lore's customer-facing copy complies with Google Merchant Center's (GMC) "Misrepresentation" policy. We removed absolute, unverifiable, or risky marketing claims and replaced them with transparent, verifiable descriptions of business operations, while preserving the premium ecommerce feel and maintaining the approved legal business identity.

## Executive Summary
All explicit guarantees of authenticity, hyperbolic marketing claims, and overly technical security jargon were replaced with softer, compliance-friendly copy focused on product clarity, verifiable sourcing, and customer support. The business identity wording was strictly maintained to reflect the verifiable legal entity.

## Summary of Changes

### 1. Hero & Site Settings (Phase 1)
**Before:** "Build legendary decks with guaranteed authentic trading card games from the most trusted TCG store."
**After:** "Shop trading card games, sealed products, singles, and collectibles with clear availability, pre-order timing, and support details before checkout."

### 2. About Page (Phase 2)
**Before:** "serving 50,000+ satisfied TCG customers worldwide", "100% Authentic Trading Cards Guarantee", "Every trading card product is verified by our expert team."
**After:** Changed to focus on "Collectors & Players", "Product Sourcing & Review", and "Product details, condition, availability, and pre-order timing are reviewed before being shown on the storefront."
*Note: Fictional founder names and origin stories were replaced with the company's objective mission regarding storefront clarity.*

### 3. Homepage Trust Section (Phase 3)
**Before:** "What Our TCG Customers Say" alongside "Read reviews from satisfied customers who trust us for authentic trading cards".
**After:** The section was entirely restructured into "Why Shop With TCG Lore", providing 5 actionable informational cards: Clear Product Pages, Pre-Order Transparency, Customer Support, Secure Checkout, and Policy Clarity.

### 4. Payment & Orders (Phase 4)
**Before:** "256-bit SSL Encryption", "PCI DSS Compliant", "AI Fraud Detection", "Manual Review Process", "Items picked from our warehouse".
**After:** Refactored into "Secure Payment Processing" and "Order Review". Replaced warehouse terminology with "fulfillment workflow". Added clear expectations for pre-order payment processing.

### 5. Policy & Sitewide Consistency (Phase 5)
A thorough scan was performed across checkout pages, policy pages, product details, and the shopping cart.
**Changes Included:**
- Removed "100% Authentic Guarantee" and replaced with "Verified Sourcing".
- Replaced "256-bit SSL" and "PCI DSS" with "Secure connection" and "Secure payment processing".
- Corrected FAQ claims regarding physical stores to clarify "TCG Lore operates exclusively as an online storefront."
- Ensured all return and pre-order policies avoid risky absolute claims (e.g., removing "Full refund guaranteed" to "Eligible for full refund").

## Files Modified
- `scripts/11-create-site-settings.sql`
- `app/about/page.tsx`
- `app/page-client.tsx`
- `app/payment-and-orders/page.tsx`
- `app/payment/page.tsx`
- `app/privacy/page.tsx`
- `app/products/[slug]/page-client.tsx`
- `app/faq/page.tsx`
- `app/contact/contact-form.tsx`
- `app/checkout/success/page.tsx`
- `app/components/product-verification-modal.tsx`
- `app/checkout/page.tsx`
- `app/checkout/components/payment-processing-modal.tsx`
- `app/cart/cart-page-client.tsx`
- `app/shipping/page.tsx`
- `app/preorder-info/page-client.tsx`
- `app/terms/page.tsx`
- `app/preorder-policy/page.tsx`
- `app/returns/page.tsx`

## Legal Identity Compliance
The verified business operator name, **"TCG Lore is an online store operated by A Toy Haulerz LLC."**, has been strictly maintained across the site's footers and contact/policy pages.

The website copy is now optimized for a Google Merchant Center human review.
