#!/usr/bin/env node
/**
 * SEO health check — run against the LIVE site to catch regressions.
 *
 * Verifies, for the production site:
 *   - robots.txt is reachable and still disallows /admin
 *   - sitemap.xml is reachable, non-empty, and every URL in it returns 200
 *   - each key page has a <title>, a meta description, a same-host canonical,
 *     and JSON-LD that parses
 *
 * Exits non-zero (failing the GitHub Action → email notification) if anything
 * regresses. No dependencies — uses Node's global fetch (Node 18+).
 *
 *   SITE_URL=https://trellee.com node scripts/seo-check.mjs
 */
const BASE = (process.env.SITE_URL || "https://trellee.com").replace(/\/+$/, "");
const KEY_PAGES = ["/", "/contact", "/services", "/portfolio", "/blog", "/about", "/book"];

const fails = [];
const warns = [];

async function get(target) {
  const url = target.startsWith("http") ? target : BASE + target;
  try {
    const res = await fetch(url, {
      headers: { "user-agent": "Trellee-SEO-Check" },
      redirect: "manual",
    });
    const body = res.status < 400 ? await res.text() : "";
    return { url, status: res.status, body };
  } catch (e) {
    return { url, status: 0, body: "", error: String(e) };
  }
}

const jsonLdBlocks = (html) =>
  [...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map(
    (m) => m[1],
  );

async function main() {
  // robots.txt
  const robots = await get("/robots.txt");
  if (robots.status !== 200) fails.push(`robots.txt -> ${robots.status}`);
  else if (!/Disallow:\s*\/admin/i.test(robots.body))
    fails.push("robots.txt no longer disallows /admin");

  // sitemap + every URL it lists
  const sitemap = await get("/sitemap.xml");
  let urls = [];
  if (sitemap.status !== 200) {
    fails.push(`sitemap.xml -> ${sitemap.status}`);
  } else {
    urls = [...sitemap.body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
    if (urls.length === 0) fails.push("sitemap.xml is empty");
  }
  for (const u of urls) {
    const r = await get(u);
    if (r.status !== 200) fails.push(`sitemap URL ${u} -> ${r.status}`);
  }

  // key pages: title, meta description, canonical host, valid JSON-LD
  for (const p of KEY_PAGES) {
    const r = await get(p);
    if (r.status !== 200) {
      fails.push(`${p} -> ${r.status}`);
      continue;
    }
    if (!/<title>[^<]+<\/title>/i.test(r.body)) fails.push(`${p} missing <title>`);
    if (!/name="description"/i.test(r.body)) fails.push(`${p} missing meta description`);
    const can = r.body.match(/<link[^>]+rel="canonical"[^>]+href="([^"]+)"/i);
    if (!can) fails.push(`${p} missing canonical`);
    else if (!can[1].startsWith(BASE)) fails.push(`${p} canonical wrong host: ${can[1]}`);
    const blocks = jsonLdBlocks(r.body);
    if (blocks.length === 0) warns.push(`${p} has no JSON-LD`);
    for (const b of blocks) {
      try {
        JSON.parse(b);
      } catch (e) {
        fails.push(`${p} invalid JSON-LD: ${e.message}`);
      }
    }
  }

  console.log(`SEO health check — ${BASE}`);
  console.log(`  sitemap URLs checked: ${urls.length}`);
  console.log(`  key pages checked:    ${KEY_PAGES.length}`);
  if (warns.length) {
    console.log(`\nWarnings (${warns.length}):`);
    warns.forEach((w) => console.log(`  · ${w}`));
  }
  if (fails.length) {
    console.log(`\n❌ Failures (${fails.length}):`);
    fails.forEach((f) => console.log(`  · ${f}`));
    process.exit(1);
  }
  console.log("\n✅ All SEO checks passed.");
}

main().catch((e) => {
  console.error("SEO check crashed:", e);
  process.exit(1);
});
