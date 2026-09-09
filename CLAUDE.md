# The Plug — Claude Code Project Instructions

## Repository
- Source of truth: `farid232323/the-plug-ai`
- Production application root: `the-plug-ai-fullstack-v0.6`
- Production branch: `main`

## Production architecture
- Frontend + main backend service: `the-plug-ai-live` on Railway
- Public entrypoint: `the-plug-ai-fullstack-v0.6/places-gateway.js`
- Internal customer gateway: `the-plug-ai-fullstack-v0.6/gateway.js`
- Internal app/server: `the-plug-ai-fullstack-v0.6/server.js`
- Supplier worker: `the-plug-ai-fullstack-v0.6/supplier-worker`
- Database: SQLite
- Supplier worker uses a persistent Railway `/data` volume.

## Current storefront rules
- Product catalog data comes from the database/API, not the legacy hard-coded demo product array.
- `plug-cart` in browser localStorage is the canonical frontend cart state.
- Checkout must render the exact current `plug-cart` contents.
- A cart mutation must invalidate stale supplier shipping quote state.
- Product identity should use database `product_id` first, then MFG/SKU as fallback.
- Do not use fake `ThePlug ID` placeholders for real catalog products.
- Storefront discovery must support brand, category, search and vehicle fitment without silently limiting results to the first 200 records.

## Supplier integration rules
- The Plug supports multiple supplier brands.
- Supplier selection is based on the product catalog `brand_name` and the supplier registry aliases.
- Valvetronic, P3 and AUTOID are current integration targets.
- Prefer stable supplier product/variant IDs or SKU mappings over browser-searching a supplier site on every checkout.
- Browser automation should be a fallback, not the primary long-term production strategy where an API/cart endpoint is available.
- Shipping quotes are requested at checkout using the customer's Saudi delivery address.
- Mixed-supplier carts may require multiple live supplier quotes and a combined shipping total.
- Persistent authenticated supplier sessions should live only in the supplier worker's secure volume.
- Never expose supplier credentials, OTP state, cookies, session files or API keys to the frontend.

## Google Places
- Saudi address autocomplete is proxied server-side through `places-gateway.js`.
- `GOOGLE_PLACES_API_KEY` must remain a Railway environment variable and must never be committed.

## Secrets
Never commit, print or hard-code:
- Google Places keys
- Railway secrets
- supplier credentials
- OTP codes
- session cookies/storage state
- Resend keys
- admin passwords

Use environment variables and existing secret-management patterns.

## Collaboration workflow
- Inspect relevant files before making claims or edits.
- Keep changes small and scoped.
- For substantial work, prefer a feature branch + pull request rather than editing `main` directly.
- Do not deploy production unless explicitly requested/approved.
- Before production deployment, confirm the exact commit SHA and Railway service being deployed.
- Only one agent should perform the final production deployment at a time.
- Preserve working integrations while changing adjacent code.

## Testing expectations
For storefront/cart work test this sequence:
1. Add Product A.
2. Confirm drawer/cart count and subtotal.
3. Remove Product A.
4. Add Product B from a different brand.
5. Open Cart.
6. Open Checkout.
7. Confirm only Product B appears.
8. Confirm stale shipping quote was cleared.

For supplier work test:
1. Supplier is enabled and brand aliases match catalog `brand_name`.
2. Product resolves to supplier SKU/product identity.
3. Saudi address is complete.
4. Quote returns stock/availability and shipping rate.
5. Currency is converted to SAR correctly.
6. Frontend displays the returned shipping amount and recalculates VAT/total.

## Important instruction
Never speculate about code that has not been opened. Read the relevant code first, then explain or modify it.
