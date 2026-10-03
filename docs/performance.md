# Performance verification

Measured October 3, 2026, against production builds of `origin/main` (`7e6a487`) and the current workspace. This is local comparison evidence, not field Core Web Vitals. UI/device acceptance and deployed measurements remain separate.

## Method

The baseline is an isolated worktree with its original dependency versions. Community Hugeicons aliases and a compatible clock icon export were applied so it could build without a private registry token; its Turbopack root was explicitly set. Both apps use disposable local PostgreSQL databases containing equivalent public fixtures. No customer database is used.

`scripts/benchmark.mts` launches a fresh Chromium profile for each sample, alternates baseline/current order, waits two animation frames on the blank renderer before navigation, and records navigation, paint and resource timing at 1440×1000. Paint observation continues through network idle and two animation frames so hydration is not cut off at the load event. Each median below uses 30 samples per version, Chrome 153.0.8010.47, without network or CPU throttling. Initial JavaScript counts encoded script response bytes completed by the load event; it excludes later prefetches. The load event is not a measure of complete interaction readiness.

```sh
CHROME_PATH=/usr/bin/google-chrome pnpm test:performance \
  --baseline http://127.0.0.1:3003 \
  --current http://127.0.0.1:3002 \
  --routes /sign-in,/external/fixture/feedback,/external/fixture/feedback/fixture-post,/external/fixture/roadmap,/external/fixture/changelog \
  --samples 30 --output .context/benchmark/navigation-subset.json
```

Use equivalent fixtures and production environment variables for both builds. Do not run browser tests, builds or other CPU-intensive work during measurement. `--ready-text 'Keep feedback'` additionally records when the fixture is visible; that measurement includes Playwright polling overhead and is reported separately.

## Final technical comparison

The final public-route run is `.context/benchmark/session-reuse.json` (30 samples per version). Sign-in is unchanged by the subsequent request-session reuse and uses `.context/benchmark/public-css.json` (also 30 samples). These runs follow route stylesheet isolation, identical computed styles across 56 screen combinations, and passing production browser checks.

| Page | LCP baseline → current | Load baseline → current | Initial JS baseline → current |
| --- | --- | --- | --- |
| Sign-in | 84 → 52 ms | 110.10 → 107.85 ms | 450,027 → 297,505 bytes |
| Feedback list | 92 → 92 ms | 151.05 → 148.80 ms | 570,881 → 509,715 bytes |
| Feedback thread | 94 → 92 ms | 153.25 → 145.60 ms | 562,993 → 457,529 bytes |
| Roadmap | 88 → 88 ms | 146.80 → 134.10 ms | 558,585 → 432,439 bytes |
| Changelog | 90 → 88 ms | 147.50 → 134.05 ms | 595,549 → 422,238 bytes |

FCP/LCP, DOM-interactive, load and initial JavaScript meet the requested 10% comparison on every measured route. This closes the page-paint/bundle regressions; it is **not** a claim that every intermediate timing is faster.

### First-byte investigation and SEO tradeoff

Feedback-list TTFB remains 16.20 → 18.05 ms (+11.4%, +1.85 ms). Unlike the baseline, the new page waits for actual feedback before returning indexable content. A JavaScript-disabled production-browser comparison confirms the baseline exposes only the navigation/filter shell, whereas the current response exposes “Keep feedback.” Reintroducing the old shell would remove the requested SEO behavior.

The separate final 30-sample content-readiness comparison, `.context/benchmark/final-feedback-readiness.json`, measures the same visible feedback on both versions: **264.60 → 252.10 ms (−4.7%)**. Its FCP/LCP is 94 → 100 ms (+6.4%), load 156.85 → 158.15 ms (+0.8%), DOM-interactive improves 22.8%, and initial JavaScript decreases 10.7%. TTFB in that run is 16.25 → 18.75 ms (+2.50 ms); the cost is retained and disclosed. The first-byte milestones deliver different content, so content readiness and page paint resolve the performance concern without disabling server rendering or weakening authorization. There is no blanket TTFB-threshold pass or claim that this overhead disappeared.

Server-rendered tRPC calls now reuse the request-scoped cookie-session lookup. Explicit credentials never invoke that resolver, and HTTP transports keep their normal lookup. Seven focused credential/context tests and all 11 browser workflows pass after this change. All earlier samples below remain historical evidence rather than alternative runs selected for favorable medians.

## Navigation feature checkpoint

| Page | LCP baseline → current | Load baseline → current | Initial JS baseline → current |
| --- | --- | --- | --- |
| Sign-in | 86 → 100 ms | 113.15 → 112.90 ms | 450,027 → 297,505 bytes |
| Feedback list | 88 → 94 ms | 141.40 → 142.80 ms | 570,881 → 509,715 bytes |
| Feedback thread | 88 → 92 ms | 140.45 → 142.00 ms | 562,993 → 457,529 bytes |
| Roadmap | 92 → 98 ms | 132.25 → 133.30 ms | 558,585 → 432,439 bytes |
| Changelog | 88 → 84 ms | 141.50 → 129.75 ms | 595,549 → 422,238 bytes |

This 30-sample comparison is `.context/benchmark/navigation-subset.json`. All four public routes are within the 10% paint threshold after loading only Motion's animation features and deriving the active tab directly from the URL. Initial JavaScript decreases by 10.7–29.1% on public routes and 33.9% on sign-in. All load-event changes stay within 10%. **Sign-in still fails the paint threshold: 86 → 100 ms (+16.3%).** TTFB also exceeds 10% on sign-in (3.05 → 3.75 ms), feedback list (14.90 → 17.00 ms), and roadmap (10.45 → 11.80 ms). Small absolute deltas are reported, not waived. This checkpoint precedes the overall server-read deadline addition; it does not establish final-source performance completion.

## Investigation and remaining work

The initial comparison exposed database schema barrels pulling Drizzle and server Effect code into browser bundles. Pure validator subpaths, server-side settings decoding and an AST dependency guard removed that leak. The production query provider no longer imports server environment validation or logs request payloads. Browser-only feedback validation uses Zod Mini, checked against the shared Effect input contract. Theme cookie validation no longer imports a full schema library. Geist Mono is loaded when used rather than preloaded on every page. The root theme provider now has a separate module, retaining the existing exports while avoiding theme-menu dependencies on sign-in. This removes a further 53 KB of initial JavaScript on that route.

An experimental server-rendered sign-in wrapper worsened timing and was reverted. A separate fixture-readiness run measured feedback content at 266.1 → 248.9 ms and roadmap content at 262.8 → 252.4 ms. JavaScript-disabled thread measurements painted faster in the current app; enabling JavaScript reproduced the remaining delay. A font-controlled diagnostic using Arial on both versions did not reproduce the sign-in regression, but its request interception changes the timing conditions, so it does not establish typography as the cause. Browser startup, font selection and hydration scheduling remain candidates.

The preceding 30-sample run is `.context/benchmark/final-197.json`, measured after all 197 tests and nine browser workflows passed, with no concurrent build or test load. Auth forms now load the Better Auth client on submission, and authentication routes omit product query/URL providers. The final source includes the shared execution and deadline changes. `CHROME_PATH` selects the preinstalled browser in this VM; omit it where Playwright browsers are installed normally.

Earlier `candidate.json`, `scoped.json`, `lazy-auth.json`, `provider.json`, `settled.json`, `readiness.json`, CPU profiles and diagnostic comparisons remain retained. A system-font interception diagnostic did not improve paint timing; no diagnostic font override or framework bootstrap patch is included. Earlier `release.json` ended paint observation shortly after load and is superseded by settled measurements. A single diagnostic CPU profile showed less aggregate script execution in the new build, so reduced bundle size alone does not explain paint scheduling. Timing varies by a frame between runs; the remaining regressions must not be described as passing or erased by selecting a favorable run. The current fixture database also contains test-created organizations while the baseline contains its public fixture only; field/device performance is not established by these local results. Profile the affected routes and retain any follow-up alongside this report. UI/UX acceptance and real-device interaction remain separate work.

## Deferred portal dialogs follow-up

A targeted 15-sample comparison in `.context/benchmark/deferred-dialogs.json` measures lazy first-use auth/submission dialogs, keeping them mounted after first use. Initial JavaScript decreases to 469,715 bytes on the thread (−16.6% against baseline) and 444,625 bytes on roadmap (−20.4%). The corresponding LCP medians are 84 → 100 ms and 88 → 104 ms. The regression remains open; smaller bundles did not establish faster paint. This run precedes the small portal callback/permission refresh fix, which has passing browser coverage. No timing claim is made for that later fix.

## Startup ordering investigation

Six paired CDP traces are retained as `roadmap-trace-{sample}-{port}.json`. They show slow cases where the React startup task runs before the first layout, while baseline cases can complete layout before that task. This is browser startup ordering; reduced payload alone does not guarantee an earlier frame. Tracing itself adds overhead, so these traces diagnose scheduling and do not replace the uninstrumented benchmark.

The portal now uses `LazyMotion` with the synchronous `domAnimation` feature subset and the `motion/react-m` entry point, following [Motion's supported bundle guidance](https://motion.dev/docs/react-lazy-motion). No framework patch, artificial startup delay, or font override is included. Async feature loading was tried and rejected because the selected-tab indicator stayed hidden; a browser assertion now checks that indicator alongside the existing portal actions. The final synchronous variant passes that regression. The active tab is derived directly from the URL, removing an extra state/effect render.

## Auth stylesheet checkpoint

The next 30-sample comparison, `.context/benchmark/route-css.json`, includes the server-read deadline and auth stylesheet isolation. Sign-in LCP improves from 80 to 52 ms (−35%); its initial JavaScript remains 297,505 bytes (−33.9%). All route load-event medians improve and initial JavaScript stays below baseline. Feedback-list LCP is 92 → 98 ms, thread 92 → 104 ms, roadmap 98 → 96 ms, and changelog 94 → 88 ms. Thread paint still exceeds 10%; roadmap TTFB (12.20 → 14.05 ms) and DOM-interactive (51.60 → 57.75 ms) also exceed it. The gate remains open. This measurement precedes separate public/widget stylesheet isolation.
