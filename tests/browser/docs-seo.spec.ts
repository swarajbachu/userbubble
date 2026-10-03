import { expect, test } from "@playwright/test";

const LOCAL = /^http:\/\/(localhost|127\.0\.0\.1):\d+$/;
const CANONICAL = /<link rel="canonical" href="([^"]+)"/;
const LOC = /<loc>([^<]+)<\/loc>/g;

test("documentation discovery links resolve to canonical server-rendered pages", async ({
  request,
}) => {
  const base = process.env.TEST_DOCS_URL;
  test.skip(
    !(base && LOCAL.test(base)),
    "Requires a disposable local documentation server"
  );
  const sitemap = await request.get(`${base}/sitemap.xml`);
  expect(sitemap.ok()).toBe(true);
  const urls = [...(await sitemap.text()).matchAll(LOC)].map(
    (match) => new URL(match[1] ?? "")
  );
  expect(urls.length).toBeGreaterThan(10);
  expect(new Set(urls.map((url) => url.href)).size).toBe(urls.length);
  const origin = urls[0]?.origin;
  const robots = await request.get(`${base}/robots.txt`);
  expect(robots.ok()).toBe(true);
  expect(await robots.text()).toContain(`Sitemap: ${origin}/sitemap.xml`);
  for (const url of urls) {
    expect(url.origin).toBe(origin);
    const response = await request.get(`${base}${url.pathname}`);
    expect(response.ok(), url.pathname).toBe(true);
    const html = await response.text();
    expect(new URL(CANONICAL.exec(html)?.[1] ?? "").href, url.pathname).toBe(
      url.href
    );
    expect(html, url.pathname).toContain("<h1");
    expect(html, url.pathname).not.toContain('content="noindex');
  }
});
