## Goal

Make every page live under a language prefix: `/en/...` for English and `/he/...` for Hebrew. The current URL becomes the source of truth for the language, which is the SEO best practice for bilingual sites.

Examples after the change:
- `/` → auto-redirect to `/en` or `/he` based on browser language
- `/en/products`, `/he/products`
- `/en/product/ceramic-mug`, `/he/product/ספל-קרמיקה`
- Language switcher swaps the prefix in the URL (and uses the translated slug on product pages)

## Approach

Instead of rewriting every `<Link to="/foo">` in 26 files, I'll use React Router's `basename` feature: the router is mounted with `basename="/he"` or `basename="/en"`, and every existing `<Link to="/products">` automatically resolves to `/he/products` or `/en/products`. No Link rewrites needed.

## Changes

### 1. `src/App.tsx` — bootstrap with language prefix
Before rendering `<BrowserRouter>`:
- Read first path segment. If it's `en` or `he`, use it as basename.
- If missing (e.g. `/`, `/products`), detect language from `localStorage.storeLocale` or `navigator.language`, then `history.replaceState` to inject the prefix.
- Mount `<BrowserRouter basename={`/${lang}`}>`.

### 2. `src/contexts/LocaleContext.tsx` — URL becomes the source of truth
- Initial `locale` reads from the URL prefix (not localStorage).
- `setLocale(next)`: replace the first path segment with the new language and hard-reload (so all data refetches in the new locale). For product pages, look up the translated slug from `product.localeSlugs` before navigating.
- Keep persisting `storeLocale` in `localStorage` so the default for first visits is remembered.

### 3. `src/components/SEO.tsx` — locale-aware canonical
- Read current locale from `LocaleContext` and prepend `/${locale}` to `path` when forming canonical/og:url.
- `alternates` array stays as-is (callers pass full localized paths).

### 4. `src/pages/ProductDetail.tsx` — localized alternates
Build alternates as `/${loc}/product/${slug}` for each locale instead of `/product/${slug}`.

### 5. `scripts/generate-sitemap.ts` — emit prefixed URLs
- Static pages: emit both `/en/...` and `/he/...` with `xhtml:link hreflang` between them and `x-default` → `/en/...`.
- Products: emit `/en/product/{enSlug}` and `/he/product/{heSlug}` with cross-linking hreflang.

### 6. `public/robots.txt`
Already permissive; no change needed.

## Things that stay the same

- All `<Link to="/...">` calls across 26 files — `basename` handles them transparently.
- i18n strings, Brainerce SDK config, Zustand stores.
- Translated product slugs already stored in Brainerce.

## Notes

- This is a hard-cutover: old URLs like `/product/ceramic-mug` (no prefix) will redirect to `/en/product/ceramic-mug` on first hit, so external links keep working.
- Google may take a few weeks to recrawl and update indexed URLs.
- The language switcher in the header continues to work; clicking "HE" on an English product page navigates to `/he/product/{hebrewSlug}` (or `/he/products` if no translated slug exists).
