// Runs before `vite dev` and `vite build` (predev/prebuild hooks); writes public/sitemap.xml.
// Fetches all product slugs from the Brainerce catalog, including per-locale
// `localeSlugs`, and emits hreflang alternates for each product entry.

import { writeFileSync } from "fs";
import { resolve } from "path";
import { BrainerceClient } from "brainerce";

const BASE_URL = "https://brainerce-template.lovable.app";
const SALES_CHANNEL_ID = "vc_QLZzLkJhqa1wsjPwy93VO";

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

const STATIC_LOCALES = ["en", "he"]; // bilingual store; static pages serve both
const staticAlternates = (path: string): Alternate[] => [
  ...STATIC_LOCALES.map((l) => ({ hreflang: l, path })),
  { hreflang: "x-default", path },
];

const staticEntries: SitemapEntry[] = [
  { path: "/", changefreq: "weekly", priority: "1.0", alternates: staticAlternates("/") },
  { path: "/products", changefreq: "daily", priority: "0.9", alternates: staticAlternates("/products") },
  { path: "/about", changefreq: "monthly", priority: "0.6", alternates: staticAlternates("/about") },
  { path: "/contact", changefreq: "monthly", priority: "0.5", alternates: staticAlternates("/contact") },
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
      const alts: Alternate[] = Object.entries(localeSlugs)
        .filter(([, s]) => !!s)
        .map(([loc, s]) => ({ hreflang: loc, path: `/product/${s}` }));
      if (alts.length) {
        const def = localeSlugs.en || p.slug;
        alts.push({ hreflang: "x-default", path: `/product/${def}` });
      }
      entries.push({
        path: `/product/${p.slug}`,
        changefreq: "weekly",
        priority: "0.7",
        alternates: alts.length ? alts : undefined,
      });
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
