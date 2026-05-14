// Runs before `vite dev` and `vite build` (predev/prebuild hooks); writes public/sitemap.xml.
// Fetches all product slugs from the Brainerce catalog so dynamic /product/:slug
// routes are included in the sitemap.

import { writeFileSync } from "fs";
import { resolve } from "path";
import { BrainerceClient } from "brainerce";

// TODO: replace with your project URL once a project name or custom domain is set.
const BASE_URL = "";

const SALES_CHANNEL_ID = "vc_QLZzLkJhqa1wsjPwy93VO";

interface SitemapEntry {
  path: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

const staticEntries: SitemapEntry[] = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/products", changefreq: "daily", priority: "0.9" },
  { path: "/about", changefreq: "monthly", priority: "0.6" },
  { path: "/contact", changefreq: "monthly", priority: "0.5" },
];

async function fetchProductEntries(): Promise<SitemapEntry[]> {
  const client = new BrainerceClient({ salesChannelId: SALES_CHANNEL_ID });
  const entries: SitemapEntry[] = [];
  let page = 1;
  const limit = 100;

  // Walk all pages
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const res = await client.getProducts({ page, limit });
    const items = res?.data ?? [];
    for (const p of items) {
      if (!p?.slug) continue;
      entries.push({
        path: `/product/${p.slug}`,
        changefreq: "weekly",
        priority: "0.7",
      });
    }
    const total = res?.pagination?.total ?? items.length;
    if (page * limit >= total || items.length === 0) break;
    page += 1;
  }

  return entries;
}

function generateSitemap(entries: SitemapEntry[]) {
  const urls = entries.map((e) =>
    [
      `  <url>`,
      `    <loc>${BASE_URL}${e.path}</loc>`,
      e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
      e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
      e.priority ? `    <priority>${e.priority}</priority>` : null,
      `  </url>`,
    ]
      .filter(Boolean)
      .join("\n"),
  );

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...urls,
    `</urlset>`,
  ].join("\n");
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
