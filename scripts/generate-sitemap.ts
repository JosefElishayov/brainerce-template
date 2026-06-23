// Runs before `vite dev` and `vite build` (predev/prebuild hooks); writes public/sitemap.xml.
// Emits language-prefixed URLs (/en/... and /he/...) with hreflang alternates.

import { writeFileSync } from "fs";
import { resolve } from "path";
import { BrainerceClient } from "brainerce";

const BASE_URL = "https://brainerce-template.lovable.app";
const SALES_CHANNEL_ID = "vc_QLZzLkJhqa1wsjPwy93VO";
const LOCALES = ["en", "he"] as const;
const DEFAULT_LOCALE: (typeof LOCALES)[number] = "en";

interface Alternate {
  hreflang: string;
  path: string;
}

interface SitemapEntry {
  path: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
  alternates?: Alternate[];
}

function staticEntriesFor(routePath: string, opts: { changefreq?: SitemapEntry["changefreq"]; priority?: string }): SitemapEntry[] {
  const alts: Alternate[] = [
    ...LOCALES.map((l) => ({ hreflang: l, path: `/${l}${routePath === "/" ? "" : routePath}` })),
    { hreflang: "x-default", path: `/${DEFAULT_LOCALE}${routePath === "/" ? "" : routePath}` },
  ];
  return LOCALES.map((l) => ({
    path: `/${l}${routePath === "/" ? "" : routePath}`,
    changefreq: opts.changefreq,
    priority: opts.priority,
    alternates: alts,
  }));
}

const staticEntries: SitemapEntry[] = [
  ...staticEntriesFor("/", { changefreq: "weekly", priority: "1.0" }),
  ...staticEntriesFor("/products", { changefreq: "daily", priority: "0.9" }),
  ...staticEntriesFor("/about", { changefreq: "monthly", priority: "0.6" }),
  ...staticEntriesFor("/contact", { changefreq: "monthly", priority: "0.5" }),
];

async function fetchProductEntries(): Promise<SitemapEntry[]> {
  const client = new BrainerceClient({ salesChannelId: SALES_CHANNEL_ID });
  const entries: SitemapEntry[] = [];
  let page = 1;
  const limit = 100;

  while (true) {
    const res = await client.getProducts({ page, limit });
    const items = res?.data ?? [];
    for (const p of items as Array<{ slug?: string | null; localeSlugs?: Record<string, string> | null }>) {
      if (!p?.slug) continue;
      const localeSlugs = p.localeSlugs || {};
      // Resolve a slug for every supported locale (fall back to base slug)
      const perLocale = LOCALES.map((l) => ({
        locale: l,
        slug: localeSlugs[l] || (l === DEFAULT_LOCALE ? p.slug! : null),
      })).filter((x): x is { locale: string; slug: string } => !!x.slug);

      if (!perLocale.length) continue;

      const alts: Alternate[] = perLocale.map((x) => ({
        hreflang: x.locale,
        path: `/${x.locale}/product/${x.slug}`,
      }));
      const def = perLocale.find((x) => x.locale === DEFAULT_LOCALE) || perLocale[0];
      alts.push({ hreflang: "x-default", path: `/${def.locale}/product/${def.slug}` });

      for (const x of perLocale) {
        entries.push({
          path: `/${x.locale}/product/${x.slug}`,
          changefreq: "weekly",
          priority: "0.7",
          alternates: alts,
        });
      }
    }
    const total = res?.pagination?.total ?? items.length;
    if (page * limit >= total || items.length === 0) break;
    page += 1;
  }

  return entries;
}

function generateSitemap(entries: SitemapEntry[]) {
  const hasAlternates = entries.some((e) => e.alternates?.length);
  const urls = entries.map((e) =>
    [
      `  <url>`,
      `    <loc>${BASE_URL}${e.path}</loc>`,
      e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
      e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
      e.priority ? `    <priority>${e.priority}</priority>` : null,
      ...(e.alternates?.map(
        (a) => `    <xhtml:link rel="alternate" hreflang="${a.hreflang}" href="${BASE_URL}${a.path}"/>`,
      ) ?? []),
      `  </url>`,
    ]
      .filter(Boolean)
      .join("\n"),
  );

  const urlsetOpen = hasAlternates
    ? `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">`
    : `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

  return [`<?xml version="1.0" encoding="UTF-8"?>`, urlsetOpen, ...urls, `</urlset>`].join("\n");
}

async function main() {
  let productEntries: SitemapEntry[] = [];
  try {
    productEntries = await fetchProductEntries();
  } catch (err) {
    console.warn("[sitemap] Failed to fetch products, writing static-only sitemap:", err);
  }
  const all = [...staticEntries, ...productEntries];
  writeFileSync(resolve("public/sitemap.xml"), generateSitemap(all));
  console.log(`sitemap.xml written (${all.length} entries: ${staticEntries.length} static + ${productEntries.length} products)`);
}

main();
