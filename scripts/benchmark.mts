import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { parseArgs } from "node:util";
import { chromium } from "@playwright/test";

const { values } = parseArgs({
  options: {
    baseline: { type: "string" },
    current: { type: "string" },
    routes: { type: "string", default: "/sign-in" },
    "ready-text": { type: "string" },
    samples: { type: "string", default: "15" },
    output: { type: "string", default: ".context/benchmark/reproducible.json" },
  },
});
if (!(values.baseline && values.current)) {
  throw new Error(
    "Pass --baseline URL and --current URL for two production builds with equivalent fixtures"
  );
}
const count = Number(values.samples);
if (!Number.isInteger(count) || count < 3 || count > 100) {
  throw new Error("--samples must be an integer between 3 and 100");
}
const routes = values.routes.split(",");
type Sample = {
  route: string;
  version: "baseline" | "current";
  iteration: number;
  browserVersion: string;
  contentReadyMs: number | null;
  ttfbMs: number;
  fcpMs: number | null;
  lcpMs: number | null;
  domInteractiveMs: number;
  loadMs: number;
  javascriptBytes: number;
};
const samples: Sample[] = [];
for (const route of routes) {
  for (let iteration = 0; iteration < count; iteration++) {
    const versions = ["baseline", "current"] as const;
    for (const version of iteration % 2 ? [...versions].reverse() : versions) {
      const browser = await chromium.launch({
        executablePath: process.env.CHROME_PATH || undefined,
      });
      try {
        const page = await browser.newPage({
          viewport: { width: 1440, height: 1000 },
        });
        // Stabilize the blank renderer before measuring page navigation; the profile/cache is still fresh.
        await page.evaluate(
          () =>
            new Promise<void>((ready) =>
              requestAnimationFrame(() => requestAnimationFrame(() => ready()))
            )
        );
        await page.addInitScript(() => {
          const observed: { lcp: number | null } = { lcp: null };
          Object.assign(window, { __benchmark: observed });
          new PerformanceObserver((list) => {
            observed.lcp = list.getEntries().at(-1)?.startTime ?? null;
          }).observe({ type: "largest-contentful-paint", buffered: true });
        });
        const response = await page.goto(new URL(route, values[version]).href, {
          waitUntil: "load",
        });
        if (response?.status() !== 200) {
          throw new Error(`${version} ${route}: HTTP ${response?.status()}`);
        }
        let contentReadyMs: number | null = null;
        if (values["ready-text"]) {
          await page
            .getByText(values["ready-text"], { exact: true })
            .first()
            .waitFor({ state: "visible" });
          contentReadyMs = await page.evaluate(() => performance.now());
        }
        // Observe paints after hydration and route requests settle. The load event can
        // precede client-rendered content; stopping there understates baseline LCP.
        await page.waitForLoadState("networkidle");
        // Allow buffered paint observers to deliver their final entries.
        await page.evaluate(
          () =>
            new Promise<void>((paintReady) =>
              requestAnimationFrame(() =>
                requestAnimationFrame(() => paintReady())
              )
            )
        );
        const metrics = await page.evaluate(() => {
          const navigation = performance.getEntriesByType(
            "navigation"
          )[0] as PerformanceNavigationTiming;
          const resources = performance.getEntriesByType(
            "resource"
          ) as PerformanceResourceTiming[];
          const observed = (
            window as unknown as { __benchmark: { lcp: number | null } }
          ).__benchmark;
          return {
            ttfbMs: navigation.responseStart - navigation.requestStart,
            fcpMs:
              performance.getEntriesByName("first-contentful-paint")[0]
                ?.startTime ?? null,
            lcpMs: observed.lcp,
            domInteractiveMs: navigation.domInteractive,
            loadMs: navigation.loadEventEnd,
            javascriptBytes: resources
              .filter(
                (resource) =>
                  resource.initiatorType === "script" &&
                  resource.responseEnd <= navigation.loadEventEnd
              )
              .reduce((sum, resource) => sum + resource.encodedBodySize, 0),
          };
        });
        samples.push({
          route,
          version,
          iteration,
          browserVersion: browser.version(),
          contentReadyMs,
          ...metrics,
        });
      } finally {
        await browser.close();
      }
    }
  }
  console.log(`Measured ${route}`);
}
const median = (numbers: number[]) => {
  const sorted = numbers.toSorted((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  const upper = sorted[middle];
  if (upper === undefined) {
    throw new Error("No measurements recorded for a metric");
  }
  return sorted.length % 2
    ? upper
    : ((sorted[middle - 1] ?? upper) + upper) / 2;
};
const summary = routes.map((route) => {
  const metrics = [
    "ttfbMs",
    "fcpMs",
    "lcpMs",
    "domInteractiveMs",
    "loadMs",
    "javascriptBytes",
    ...(values["ready-text"] ? ["contentReadyMs" as const] : []),
  ] as const;
  return {
    route,
    metrics: Object.fromEntries(
      metrics.map((metric) => {
        const medians = ["baseline", "current"].map((version) =>
          median(
            samples
              .filter(
                (sample) => sample.route === route && sample.version === version
              )
              .map((sample) => sample[metric])
              .filter((value): value is number => value !== null)
          )
        );
        const [baseline, current] = medians as [number, number];
        return [
          metric,
          {
            baseline,
            current,
            percentChange: baseline ? (current / baseline - 1) * 100 : null,
          },
        ];
      })
    ),
  };
});
await mkdir(dirname(resolve(values.output)), {
  recursive: true,
});
await writeFile(
  values.output,
  `${JSON.stringify({ measuredAt: new Date().toISOString(), samplesPerPage: count, readinessText: values["ready-text"] ?? null, viewport: "1440x1000", cache: "fresh browser per sample", paintWindow: "network idle plus two animation frames", baseline: values.baseline, current: values.current, summary, samples }, null, 2)}\n`
);
console.log(JSON.stringify(summary, null, 2));
