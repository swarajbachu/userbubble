# Revamp verification ledger

## Current technical verification — October 3, 2026

The entries below this section are historical checkpoints. The latest technical implementation uses Effect 4.0.0 for every catalog operation, delegated execution and server read model; React state, SDK transports and third-party framework/driver callbacks retain their native APIs. UI/UX redesign and marketing are outside this technical pass.

### Implemented and exercised

- All 50 catalog operations have shared Effect input/output contracts, authorization and service implementations. Successful behavior, invalid input and authorization were exercised through dashboard tRPC, HTTP API, signed Agent Auth, compiled CLI, local MCP and OAuth remote MCP. See the [executed parity matrix](capability-parity.md#executed-parity-report--october-3-2026).
- Real PostgreSQL checks cover tenant isolation, membership downgrades, final-owner races, idempotent retries, rollback, settings/feedback revisions, atomic onboarding patches, concurrent identification and the ten-active-installation-key quota.
- Existing SDK identification and public feedback/reply/vote/release contracts remain available. SDK artifacts load through both ESM and CommonJS. Native storage works with custom storage or either optional adapter, and missing installation keys fail before network requests.
- Public feedback, roadmap and releases render without JavaScript. Browser checks cover canonical metadata, structured data, sitemaps, RSS, private/draft exclusion, sanitized release content and direct widget releases.
- Hosted model/repository execution is removed. Populated migration fixtures preserve memberships, comments, votes, branding, historical implementation links and attribution. A pre-cleanup backup was restored into a separate disposable database and checked successfully. Historical migrations remain intact.
- Browser-safe enum/form modules prevent database and server Effect code from entering client bundles. Settings are decoded on the server and passed into forms. An architecture regression guards that boundary.

### Final technical handoff

After the stylesheet work below, server-rendered tRPC calls now reuse the request-scoped session resolver. Explicit credentials still fail closed and do not call it; other transports use their existing authentication lookup. Seven focused context tests pass, including two newly added regressions. The final production build (12 tasks), typecheck (21 tasks), lint (672 files), and all 11 browser workflows (55.4 seconds) pass. PR preparation reran the complete suite after those changes: **201 tests passed**, none skipped, across 21 files in 541.80 seconds, including all six exhaustive interface workflows. Fresh production build (12 tasks), typecheck (21 tasks), and lint (672 files) also pass. Evidence is `.context/pr-verification/`; earlier targeted evidence is `.context/effect-final/session-reuse/`.

Final 30-sample production comparisons meet the 10% page paint/load/DOM/JavaScript thresholds. Feedback content readiness improves 264.6 → 252.1 ms. Feedback-list TTFB still costs 1.85–2.50 ms because the new response includes server-rendered feedback, whereas the baseline initially returns a shell and has no visible feedback without JavaScript. That SEO tradeoff is retained and disclosed in `performance.md`; no claim of a blanket TTFB pass is made. The technical implementation is ready for the separately assigned UI/UX work.

### Route stylesheet isolation

The auth/root and public/widget utility bundles now compile separately from authenticated product routes, sharing the same theme and base rules. The public layout also starts its independent organization/session reads together. Production build (12 tasks), typecheck (21 tasks), lint (672 files), and all 11 browser workflows (55.5 seconds) pass. Computed style and geometry comparisons are identical for 56 combinations of auth/public routes, two themes and four viewport widths. The unknown-path sample redirects to sign-in; it does not establish error-screen visual coverage. Raw comparisons are in `.context/css-equivalence/`; final build/type/lint/browser logs are in `.context/effect-final/public-css/`. The backend remains unchanged from the complete 199-test run below. The final performance comparison is recorded above; style equivalence alone is not a performance pass.

### Previous continuation — overall read deadlines

The current source adds the overall Effect deadline to all internal server read models, with two passing cancellation/recovery regressions. Its production build (12 tasks), typecheck (21 tasks), lint (670 files), and all 11 browser workflows (55.5 seconds) pass. The clean full run passes **199 tests**, none skipped, across 21 files in 536.55 seconds, including all six exhaustive parity workflows. The 197-test checkpoint below is historical. Evidence is `.context/effect-final/read-deadlines/`.

The portal animation-only bundle and removal of an extra header render bring all four public-route paint medians within 10% in the retained 30-sample navigation comparison. Sign-in paint and several TTFB deltas remain above the requested threshold; this is not a completed performance gate. That measurement predates the small read-runtime deadline change, so it is checkpoint evidence rather than a claim about final-source timing.

### Passing local checks

- `pnpm build`: 12 workspace tasks passed on the final shared-execution, deferred-portal-dialog and documentation SEO source.
- `pnpm typecheck`: 21 tasks passed after that production build.
- `pnpm lint`: 669 checked source files passed.
- `pnpm capabilities:check`: 50 operations, 45 dashboard/server-action references, 13 classified direct auth call types.
- `pnpm client:check`: all 50 generated contracts match, including compile-time negative fixtures.
- Full `pnpm test` with the disposable database, rehearsal database and production app: **197 passed, none skipped**, 20 files, 528.58 seconds. All six exhaustive interface workflows ran in this run; production rate limits remain enabled.
- `pnpm test:browser` against the final production app: **11 passed**, 55.3 seconds. Main-app/public/widget flows include both themes and 375/768/1440/1920px checks with no serious/critical automated accessibility findings in the tested flows.
- `pnpm test:mobile`: both iOS and Android Hermes bundles exported successfully after the native configuration/storage changes.
- Native iOS Xcode Debug and Release simulator builds: **BUILD SUCCEEDED** from a temporary source copy on macOS; the standalone release installed and rendered the sign-in screen. Android ARM64 release compilation also passed; details follow.
- `pnpm test:migration` and `pnpm test:restore`: populated migration through 0015 and backup restoration checks passed on separate local databases.
- `git diff --check`: passed.

Registry versions checked October 3: Effect 4.0.0, Better Auth 1.7.7, Agent Auth 0.6.2, MCP server 2.3.0 / SDK 1.32.0, Expo 57.0.26 and Next 16.3.8 match the installed releases.

Raw local evidence is in `.context/effect-final/`, `.context/capability-parity/`, `.context/benchmark/` and `.context/playwright/`. The checked-in CI workflow runs these gates and uploads parity/browser evidence; these measurements are local evidence, so consult the PR checks for GitHub CI results. No production migration, deployment or package publication was performed. A real Pro Hugeicons download still requires the user's registry token; the community frozen install and Pro-selection logic were verified.

### Final native and authentication checks

Xcode 26.6 (17F113) built both Debug and Release for the iOS simulator from an isolated source copy. The standalone release rendered the app successfully on iOS 26.5 / iPhone 17 Pro; evidence is `.context/native-release-launch.png`. This exposed and fixed an undeclared `metro-cache` dependency by using Expo's default Metro cache. Both Hermes exports passed again after the fix. The disposable Mac simulator/build copy was removed after saving evidence.

Android's ARM64 release APK built successfully with Java 17, Gradle 9.3.1, SDK/build tools 36 and NDK 27.1.12297006: **834 tasks**, **7m34s**. The APK is a local verification artifact using the generated development signing configuration, not a store release. Android device interaction and complete native user journeys remain part of UI/device acceptance; they are not implied by compilation or the iOS launch check.

The complete 197-test run includes invitation acceptance, browser-form/Effect input parity, cross-origin credential isolation, shared direct/delegated receipts and audits, release revisions, database cancellation and scoped pool disposal. Earlier partial-run counts below are historical and superseded.

The new sign-in browser regression passes a successful login retaining its callback. A server-rendering experiment did not improve the measured paint timing and was reverted; the existing authentication rendering behavior is retained. The client query provider no longer imports server environment validation or enables payload logging in production. The root theme provider has a separate entry point so sign-in does not load theme-menu controls; existing theme exports remain compatible. Public sitemap/feed routes explicitly render dynamically.

The final unconfigured build attempt accidentally loaded the workspace's existing external database URL and failed with `ENOENT ... 'system'` from its TLS certificate parameter. It was rerun successfully with explicit disposable-local-database build variables. Verification commands must use those explicit variables rather than relying on a developer's `.env`.

See [performance evidence](performance.md) for the retained comparisons. JavaScript payloads are smaller, but paint medians still exceed the requested 10% threshold on some routes. **The complete goal remains open on performance.** Direct dashboard/cookie-API execution now shares transactional receipts and audits with agents; database deadlines and scoped cleanup have passing live tests. See the [technical completion audit](technical-completion-audit.md). UI styling, recipient-facing invitation acceptance UI, manual device journeys, and visual polish remain owned by the UI/UX pass. No automatic invitation email delivery is configured or claimed.

## Historical checkpoints

This ledger records demonstrated behavior, not release readiness. Full product revamp acceptance is still open.

## Verified on the local disposable environment

- Twenty service, PostgreSQL, and live protocol tests passed. Repository lint passes across 571 checked files.

- Better Auth 1.7.7, Agent Auth 0.6.2, and Effect 4.0.0 install together.
- All 21 workspace typecheck tasks passed; Expo's asynchronous cookie API is handled.
- All 12 production build tasks passed, including the application, landing, docs, and SDK packages.
- Signed Agent Auth: discovery, host registration, browser approval, feedback creation, reply, idempotent retry, conflicting retry, organization constraint rejection, and immediate revocation.
- OAuth/MCP: dynamic native-client registration, PKCE, workspace selection, consent, access-token exchange, tool discovery, workspace read, and immediate rejection after consent revocation.
- SDK: existing identify, tRPC feedback submission, and portal session exchange pass; bearer tokens and identified cookies are denied management and agent-approval access.
- PostgreSQL: final-owner concurrency protection, atomic write/receipt rollback, duplicate suppression, revision conflicts, and cursor pagination.
- Migration 0011 preserves historical implementation links, comments/provenance, memberships, and branding before removing hosted execution tables. Migrations 0012 and 0013 add OAuth and feedback revisions.
- A populated local migration rehearsal was backed up with `pg_dump -Fc`, restored into a separate database, and checked for content preservation.
- The feedback-thread browser flow has zero serious/critical axe findings and no horizontal overflow at 375, 768, 1440, and 1920px, in both themes. Screenshots are in `.context/feedback-{theme}-{width}.png`.

## Reproduction

Use an empty local PostgreSQL database for migration rehearsal. Do not use customer or deployed databases.

```sh
TEST_DATABASE_URL=postgresql://USER@127.0.0.1:55432/EMPTY_DATABASE bash scripts/verify-migration.sh
TEST_DATABASE_URL=postgresql://USER@127.0.0.1:55432/TEST_DATABASE pnpm test
TEST_APP_URL=http://localhost:3000 TEST_DATABASE_URL=postgresql://USER@127.0.0.1:55432/TEST_DATABASE pnpm test
TEST_APP_URL=http://localhost:3000 pnpm exec playwright test
pnpm typecheck
pnpm build
```

Live protocol and browser tests create accounts and workspace fixtures and must target a disposable local app. Without `TEST_APP_URL`, protocol tests are skipped; without a local `TEST_DATABASE_URL`, PostgreSQL integration tests are skipped. A unit-only run does not satisfy the release gates.

## Still required for release

- Complete checked-in dashboard/Better Auth/server-action capability inventory, per-operation success/validation/denial coverage, output schemas, generated client, and OpenAPI consistency.
- Finish extraction of remaining direct database and Better Auth product calls; add complete audit coverage and strict dependency checks.
- Complete account/invitation/credential parity, organization-bound grant review, sensitive-action equivalence, SDK compatibility workflows, and delegated-role downgrade tests.
- Extend conflict and idempotency semantics beyond the implemented feedback slice.
- Complete main app and widget redesign. The user has explicitly deferred further marketing changes; preserve the current marketing page. Remaining broader surface work is not completion evidence for this focused pass.
- Extend browser, accessibility, keyboard, zoom, coarse-pointer, and screenshot coverage to every rebuilt flow. Verify 28px/32px controls automatically.
- Establish reproducible performance/bundle comparisons against the original revision, investigate regressions above 10%, and enforce all checks in CI.
- Maintain lint/format checks while completing release documentation and production migration/rollback review. Local fixture rehearsal is not a production migration.

## Public discovery acceptance
Public feedback, roadmap, organization home, release lists, and individual releases require canonical URLs and readable server-rendered content. Public releases have permanent article URLs; RSS links to those URLs. Organization sitemap indexes partition public content into 10,000-entry documents and exclude private feedback and unpublished releases. Public robots routes must respond without signing in. Private content remains subject to authorization and must never enter public discovery metadata.

The browser test in `tests/browser/public-seo.spec.ts` checks JavaScript-disabled reads, canonical metadata, safe release rendering, sitemap/RSS contents, private exclusions, and responsive release accessibility. Its result is recorded in the implementation ledger; the presence of the test alone is not evidence of passing.

## Main app and widget pass

The feedback workspace has 32px URL-backed search and sorting with hydration-safe inputs. Widget release cards use squircle panels and keyboard-operable buttons, with direct article reading. Release cards are borderless muted surfaces; the floating SDK shell uses a soft shadow. Focus indicators remain.

Release reads now use shared operations for API v1 as well as tRPC. Installation reads are organization-bound and published-only. Public outputs omit author email and private linked feedback, and sanitize authored HTML. Tests cover foreign release IDs, drafts, script payloads, and installation identities. Marketing is unchanged by this pass.

Release editing uses one `changelog.update` operation to save current content, clear optional metadata, replace linked feedback, and optionally publish. The database transaction rolls back both content and publication if linking fails. The browser acceptance edits an existing draft, publishes it, checks the persisted operation output, and reads the result in the widget. The edit page reads through tRPC rather than querying the release repository directly.

SDK v1 feedback reads, submission, and voting now adapt the shared feedback operations. Installation context forwards only its bearer token, never dashboard cookies. Live protocol coverage verifies submit/vote/unvote behavior, vote counts, foreign-organization denial without writes, schema/JSON errors, private-feedback exclusion, cookie-only write denial, and invalid bearer rejection. Existing successful response envelopes remain unchanged.

Profile completion uses shared `account.getProfile` / `account.updateProfile` operations. Unit coverage checks current-user binding, field whitelisting, invalid input, and anonymous/installation denial. The live signed-agent test updates the profile and compares management API and dashboard tRPC reads. Credential and email ceremonies remain separate; this does not establish complete account-management parity.

The Account menu now opens `/profile`. `tests/browser/profile.spec.ts` exercises saving/reloading and API parity, plus 375/768/1440/1920 layouts in both themes with no serious or critical axe findings. Authenticated users can edit their profile before joining a workspace; anonymous and installation identities remain excluded.

## Production-mode authentication checkpoint

The main app was built and served with `next start` against a disposable local PostgreSQL database. All 51 Vitest tests passed, including live signed Agent Auth, OAuth/MCP, SDK compatibility, and 13 deployment-cookie cases. All five non-marketing browser workflows passed against this production server: feedback, profile, public SEO, widget releases, and edited-draft publication. All 21 workspace typechecks and all 12 production build tasks passed; lint checked 593 files.

Production signup throttling remains enabled. Protocol fixture creation honors Better Auth's `X-Retry-After` (or standard `Retry-After`) on a bounded 429 retry. CI now starts the production build instead of a development server. These are local results; the GitHub workflow has not been executed remotely.

Cookie sharing no longer assumes `.userbubble.com`: it requires a matching configured base domain and production HTTPS. Local HTTP, unrelated previews, and deployments without a shared base domain use host-only cookies. HTTPS remains Secure/SameSite=None for the existing embedded-session flow. The auth route also includes its configured application origin in its CORS allowlist. Browser checks above prove local production sessions; they do not prove a deployed custom-domain/TLS configuration.

The alternate-origin run rebuilt the app for `http://127.0.0.1:3002`. It exposed and fixed an API v2 origin check that compared against Next.js's internal request URL. Cookie-authenticated management requests now require the configured public application origin. All 51 tests passed on that build, including explicit rejection of missing and untrusted origins. This checks a local alternate origin, not public TLS termination.

All five non-marketing browser workflows also passed on the alternate-origin production build (49.9 seconds), including responsive/theme accessibility checks. The final application build, workspace typechecks, lint, and capability inventory check passed after the origin fix.

## Membership and invitation parity checkpoint

The Members page now reads member lists, role, and invitation lists through shared operations. Ordinary members are not given the admin-only invitation list. Creating invitations and changing membership refresh the server-rendered table; pending invitations can be cancelled from the dashboard through the same operation exposed to agents.

The signed-agent protocol test creates an invitation, compares API v2 and dashboard tRPC reads, rejects invalid input and a different organization, cancels it, and reads the cancelled state. Service tests cover member denial and foreign invitation IDs. A PostgreSQL test verifies tenant-bound cancellation, repeat cancellation, and preservation of accepted invitations. All 59 service/database/protocol tests passed locally.

The Members browser flow verifies create/cancel without reloading and compares API results. It checks 375, 768, 1440, and 1920px in both themes with zero serious/critical axe findings and no page overflow. Tables retain horizontal scrolling in a labelled keyboard-focusable region, and the workspace flex container can shrink at tablet widths. Invitation acceptance/delivery, full membership role-change browser coverage, and complete CLI/MCP operation parity remain open.

The final membership changes also passed the production application build, all 21 typechecks, lint (594 files), and the 50-operation/42-dashboard-reference inventory check. Against `next start` on the alternate configured origin, all three protocol tests passed and the Members/feedback browser tests passed (31.6 seconds), including actual ArrowRight table scrolling. This is evidence for the implemented invitation slice, not complete membership/CLI/MCP parity.

## Effect output-contract checkpoint

Six of 50 shared operations now validate results with Effect Schema: `account.getProfile`, `account.updateProfile`, `settings.getMyRole`, `organization.checkSlug`, `organization.initializeOnboarding`, and `organization.updateOnboarding`. Validation runs inside the shared Effect operation before adapters serialize results. Profile projections strip extra repository fields, and malformed output becomes a generic internal failure without secret-bearing schema details.

Discovery and OpenAPI use the same output schemas; Agent Auth capability metadata includes them and the client exposes them. The checked inventory records `outputValidated` per operation. Remaining operations explicitly return `outputSchema: null` in discovery and remain an open completion gate. Tests verify malformed results, field projection, discovery/OpenAPI agreement, and live client discovery; all 63 service/database/protocol tests passed locally. Lint checked 596 files and all 21 workspace typechecks passed.

All 12 production build tasks passed after this change. The profile save/reload/API-parity browser flow passed against the production build (9.7 seconds), including its responsive/theme accessibility checks. A live comparison confirmed all six published output schemas agree between capability discovery and OpenAPI. These results do not establish full contract or interface parity for the remaining operations.

## Invitation and member output contracts

Effect output validation now covers ten of 50 operations, adding invitation creation/listing/cancellation and member listing. Dates stay as valid Date objects for dashboard consumers and become strings in JSON. Nested member and inviter records are projected to their documented fields; invalid dates fail before serialization.

Named output definitions have stable resource IDs. OpenAPI response envelopes own their definitions so local references resolve within the response schema. Ajv 8.17.1, pinned as a development dependency, independently compiles every published output and response schema and checks valid invitation data plus invalid roles, numeric dates, and extra secret fields.

The 66-test suite passed with database and live protocol coverage; the subsequent expanded contract suite passed all four tests. All 21 typecheck tasks, lint (596 files), the application production build, and the inventory check passed. The Members create/cancel/API-parity browser flow passed against the production build in 12.6 seconds, including all viewport/theme accessibility and keyboard-scroll checks. Forty output contracts and the other full-revamp gates remain open.

## External implementation references

The dashboard feedback sidebar now displays implementation links and lets workspace members add/remove them through shared operations. The browser acceptance test seeds a link through API v2, reads it in the dashboard, adds another in the UI, verifies API parity, and removes only the UI-added link. The production flow passed in 19.1 seconds across all four widths and both themes with zero serious/critical axe findings.

The signed-agent protocol test attaches an implementation URL, repeats its idempotency key, reads the same records through the dashboard tRPC adapter, and verifies agent attribution in activity. Service tests reject unsafe new URLs and foreign-organization feedback, preserve nullable historical authorship, and strip unmodelled fields from references and activity records. All 71 tests passed. Output validation now covers 14/50 operations; the inventory tracks 45 dashboard/server-action references. Types (21 tasks), lint (597 files), the application production build, inventory, and diff checks passed. This does not complete output migration, audit pagination/coverage, or all-interface parity.


## API credential output contracts

All five API-key operations now have Effect output contracts (19/50 operations total). List/create/update/revoke results project public metadata and exclude stored key hashes and signing secrets. Creation returns the raw installation key once. The dashboard uses the inferred operation result rather than a handwritten database-row type and unsafe cast.

Service tests cover field projection, one-time creation output, denied mutations, and cross-organization reads. The live protocol flow verifies SDK identification and access, rename, revocation, restoration, and deletion. The full suite passed 75 tests before the final additional read-denial case; the subsequent authorization and contract run passed 48 tests. All 21 typecheck tasks, lint (598 files), and the application production build passed. The credential browser flow passed against both development and the rebuilt production app (production: 6.1 seconds), checking one-time display and SDK access after revoke/restore.

Thirty-one output contracts remain, along with Effect input migration and full cross-interface parity. This slice does not establish complete settings accessibility, credential confirmation equivalence, or deployment readiness. Marketing remains unchanged.


## Remote MCP structured results

Remote MCP now advertises the migrated output contracts using the same response envelope as OpenAPI and returns JSON-normalized `structuredContent` plus matching text. The protocol test reads the JSON-RPC result rather than accepting HTTP 200 alone. This uncovered and fixed an existing `tools/list` failure caused by the SDK trying to describe coerced Date inputs in output mode. MCP now consumes the explicit JSON input representation; shared services still validate execution inputs.

The rebuilt production app passed all three live protocol tests and four contract tests (20.65 seconds). Coverage includes OAuth consent/revocation, profile output filtering, API-key creation with date serialization, array results with named definitions, signed-agent grants, and existing SDK compatibility checks. All 21 typecheck tasks, lint (598 files), capability inventory, and diff checks passed. Local stdio output metadata, 31 remaining shared output schemas, and broader completion gates remain open.


## Organization and settings output contracts

Eight more operations now validate/project their outputs: organization list/get/create/update and settings update/member-role change/member removal/organization deletion. Public organization fields include validated nullable onboarding state and dates, exclude installation secrets, and strip unexpected repository fields. Coverage is 27/50 operations; 23 remain.

Five new service tests cover projections, delegated workspace filtering, saved appearance, malformed results, owner/name confirmation for deletion, and membership success envelopes. The focused authorization/contract run passed 53 tests. With the database suite explicitly enabled, all 78 non-protocol tests passed; after correcting a test-call argument error, all three production protocol tests passed separately (19.68 seconds). The agent flow now updates appearance and verifies the identical API readback. The production Members browser flow passed in 15.3 seconds, including responsive/theme accessibility and keyboard-scroll checks. Production build, all 21 typecheck tasks, lint (598 files), capability inventory, and diff checks passed. These checks do not establish complete appearance propagation, every-operation parity, or completion of the full revamp.


## Connected-agent output contracts

All four connection listing/revocation operations now have Effect output contracts, bringing coverage to 31/50. Agent listings project identity and nested grant metadata; OAuth listings project consent metadata. Five new service tests verify nested field filtering, delegated workspace filtering, cross-workspace revocation denial, current-user binding, and missing-connection errors. The focused authorization/contract suite passed 58 tests.

An interrupted verification run ended with exit code 137 and stopped local database/app services; no success was inferred from that run. After restarting the disposable database and rerunning checks sequentially, all 21 typechecks, lint (598 files), production application build, inventory and diff checks passed. All three live production protocol tests then passed (21.29 seconds), including listing field/date assertions and immediate OAuth/signed-agent revocation. Nineteen shared output contracts and broader goal gates remain open.


## Changelog output contracts and linked-feedback privacy

All eight changelog operations now use Effect output contracts (39/50 operations). Release lists previously returned full linked-feedback rows; the shared list/detail contract now exposes summary fields and excludes anonymous author email and unexpected repository fields. Existing tenant/publication filtering and release HTML sanitization remain covered. Publication reports NOT_FOUND when its update returns no row. UI props accept readonly schema results, and the tags cast is removed.

The 61 focused authorization/contract tests passed, including new public-list privacy, missing publication result, and malformed release tests. All 21 typecheck tasks, lint (598 files), inventory/diff checks and the application production build passed. One development protocol run timed out; all three tests passed against the rebuilt production app in 26.37 seconds. Both production widget browser tests passed in 32.3 seconds: responsive/theme accessibility and direct release opening, plus edited-draft publication with cleared metadata. Eleven output contracts and broader full-revamp gates remain incomplete.


## Complete catalog output-schema coverage

All 50 catalog operations now declare Effect output schemas. The contract suite requires this for every catalog entry, compiles generated output/response schemas, and preserves named references. The eleven feedback operations were the final group: list/detail/search/create/update/status, votes/deletion, and comment reads/creation/deletion. Feedback projections exclude anonymous email, retain vote state and revision fields, preserve microsecond cursor strings, and retain historical comment attribution. Six feedback/roadmap UI components now use shared result types instead of database-row types.

Four new tests cover search/list privacy, historical comments, and malformed results. All 90 non-protocol tests passed with PostgreSQL enabled; all three production protocol tests passed separately in 28.17 seconds. The production feedback browser flow passed in 38.2 seconds across viewport sizes/themes with accessibility and implementation-link checks. All 21 typecheck tasks, lint (598 files), production build, inventory and diff checks passed.

This closes catalog output-schema coverage only. Effect input migration, broader shared-service extraction, generated per-operation client types, local stdio MCP metadata, comprehensive cross-interface authorization/behavior tests, and the remaining visual/mobile/performance/operational gates are still open.


## Local MCP product-tool discovery and structured results

The local MCP server now exposes all 50 named product operations alongside Agent Auth connection tools. Each product tool accepts an explicit connection ID and an operation input object, advertises the shared response schema, and returns structured results plus matching text. Capability discovery publishes `responseSchema`; a contract assertion keeps it identical to OpenAPI.

The protocol suite checks all 50 tool schemas, invalid arguments before execution, structured arrays, and structured permission errors. A subprocess test launches the actual CLI over stdio with isolated credential storage, discovers all product schemas from the rebuilt app, and confirms denial without an approved connection. The signed-agent integration test also runs the local adapter against the live API, reads implementation links, and rejects a foreign workspace. All nine contract/local-MCP/live-protocol tests passed in 22.22 seconds. All 21 typecheck tasks, CLI build, application production build, lint (599 files), inventory and diff checks passed.

This establishes local product-tool metadata and structured-result support, not exhaustive capability parity or every authenticated workflow through an actual stdio subprocess. Those broader acceptance gates remain open.


## Release filtering before pagination

Changelog tag/date filtering now runs in PostgreSQL before limit/offset instead of filtering an already limited page in application code. Equal publication/creation timestamps use an ID tie-breaker. The shared input accepts native Date values for tRPC and ISO timestamps for JSON interfaces; invalid dates and reversed ranges fail before querying.

The PostgreSQL regression test places newer nonmatching entries ahead of matching entries, then verifies two one-item pages, an exhausted page, inclusive date bounds, and tenant isolation. Service tests verify JSON conversion and rejected inputs. All 74 focused service/contract/database tests passed. The production protocol suite passed all three tests in 30.58 seconds, including API date/tag filtering and invalid-range rejection. Types (21 tasks), lint (599 files), production build, inventory and diff checks passed. This fixes offset filtering correctness; concurrent-write-safe cursor pagination for releases remains unfinished.


## Effect input boundary and profile migration

The operation builder now accepts complete Effect input contracts via `.effectInput(...)`, decoding them inside the shared Effect program. The tRPC parser delegates to the same schema. Capability discovery uses its encoded schema, and remote MCP now consumes discovery input schemas instead of converting implementation Zod parsers independently. Profile read/update are migrated (2/50 inputs); the inventory distinguishes this from complete output-schema coverage.

Existing profile tests still verify trimming, invalid names/URLs, allowed-field projection, and authorization. A new contract test checks Effect metadata and tRPC parser agreement. All 67 focused tests passed, along with 21 workspace typechecks, lint (600 files), inventory/diff checks and the production build. All five live protocol/local-MCP tests passed in 21.58 seconds against the rebuilt app. The profile browser save/reload/API-parity and responsive accessibility flow passed in 25.1 seconds. Forty-eight input contracts and other full-revamp gates remain incomplete.


## Connection and reference Effect inputs

Eight more operations now use Effect input contracts: both connection lists, both revocations, reference list/add/delete, and activity listing. Coverage is 10/50 inputs and 50/50 outputs. Reference contracts include workspace scope, nonempty resource IDs, trimmed titles and HTTP URL validation. Malformed inputs fail before repository access; existing tenant/grant rules remain enforced. The contract test now independently compiles every migrated input schema.

All 68 focused service/contract tests passed, followed by the expanded schema compilation check. All 21 typechecks, lint (600 files), production build, inventory and diff checks passed. All five production protocol/local-MCP tests passed in 21.01 seconds, including reference retries, foreign-scope denial and immediate connection revocation. The production feedback browser/reference flow passed in 41.6 seconds with responsive/theme accessibility checks. Forty input migrations and broader goal gates remain open.


## Installation scope at shared read/delete boundaries

Shared feedback list/thread/comment reads and comment deletion now assert the installation organization, as do release list/detail reads. Comment deletion resolves its parent post before checking author/member permission. Public anonymous access remains available. These guards close gaps in direct tRPC execution that SDK route-level organization selection alone did not cover.

Four new service cases verify foreign reads, foreign comment deletion before permission lookup, authorized same-workspace deletion, and anonymous release access. All 72 focused tests passed. A real SDK bearer token then read its own thread through production tRPC and received 403 for all five foreign read paths (feedback list/thread/comments and release list/detail). All three live protocol tests passed in 29.95 seconds, retaining SDK submission/voting/releases and agent checks. Types (21 tasks), lint (600 files), production build, inventory and diff checks passed. This is scoped authorization evidence, not a completed audit of all product capabilities.


## Organization and membership Effect inputs

Eleven more operations now use shared Effect input contracts: organization list/get, onboarding initialization/update, invitation list/cancellation, membership role/list/update/removal, and organization deletion. Coverage is 21/50 catalog inputs; all 50 output contracts remain enforced. Organization slug/create/update/invite and general settings inputs remain on the compatibility path.

All 73 focused authorization/contract tests passed, including malformed roles, resource IDs, deletion confirmation types and onboarding flags rejected before writes. Existing tenant, owner and confirmation safeguards remain exercised. All 21 workspace typechecks, lint (600 files), inventory/diff checks and the production build passed. All five production protocol/local-MCP tests passed in 17.88 seconds. This validates the migrated boundaries; full cross-interface capability parity remains incomplete.

The Members production browser flow passed in 33.7 seconds: create/list/cancel invitation parity, member list consistency, keyboard table scrolling, no horizontal page overflow, and no serious/critical automated accessibility findings at 375/768/1440/1920px in both themes. Screenshots are saved under `.context/members-{theme}-{width}.png`.


## Credential Effect inputs

All five installation-key operations now use shared Effect inputs: listing, creation, metadata updates, revoke/restore and deletion. Coverage is 26/50 catalog inputs and 50/50 outputs. Expiration accepts valid native Dates, JSON date strings, epoch milliseconds or null; invalid dates and booleans are rejected. Names are trimmed before checking their nonempty 50-character limit, fixing whitespace-only names. Malformed inputs fail before credential reads or writes.

All 75 focused authorization/contract tests passed, including expiration decoding, invalid-input rejection, member/admin permission checks and raw-key/hash response boundaries. Types (21 tasks), lint (600 files), inventory/diff checks and production build passed. All five production protocol/local-MCP tests passed in 18.14 seconds, including creation through OAuth MCP with an ISO expiration preserved in the response. Agent documentation includes executable create/revoke examples. Twenty-four inputs and the broader service/parity gates remain unfinished.

The first credential browser run exposed a SuperJSON compatibility gap: the dashboard submitted `description: undefined`, which an optional-key schema correctly distinguishes from an absent property. The shared Effect input boundary now omits explicit undefined object properties before decoding, matching JSON semantics while preserving Date values. A regression test exercises both the tRPC parser and direct service execution. After this fix, all 76 focused tests, 21 typechecks, lint and the rebuilt production app passed. All five live protocol/local-MCP tests passed again in 27.36 seconds. The credential browser flow passed in 10.7 seconds, verifying one-time raw-key display, masked API metadata, SDK rejection after revoke and successful SDK access after restore.


## Remaining organization Effect inputs

Organization slug checking, creation, updates and invitation creation now use Effect inputs. All organization operations are migrated, bringing total input coverage to 30/50. Slugs retain lowercase normalization, length/format validation and the existing reserved-name list. Names remain trimmed, branding URLs validated, nullable branding fields clearable and omitted invitation roles default to member. Runtime refinements remain authoritative where discovery schemas cannot encode them.

All 78 focused authorization/contract tests passed, including default-role behavior, uppercase slug normalization, reserved/invalid slugs, invalid names/emails and forbidden owner invitations. Existing owner/admin and tenant checks remain exercised. Types (21 tasks), lint (600 files), inventory/diff checks and production build passed. All five live protocol/local-MCP tests passed in 28.23 seconds. Twenty input contracts and broader service/parity gates remain unfinished.

The rebuilt Members browser flow passed in 33.9 seconds, including API/dashboard invitation consistency, cancellation, keyboard table scrolling and responsive accessibility checks at all four target widths in light/dark themes.


## Changelog Effect inputs

All eight changelog operations now use Effect inputs: list/detail, create/update, publish/delete and feedback link/unlink. Total coverage is 38/50 inputs and 50/50 outputs. Native dates and offset-qualified ISO timestamps remain supported; invalid calendar dates, reversed ranges and fractional/out-of-range pagination are rejected. Creation defaults to an unpublished draft. Readonly contract arrays are copied at repository boundaries.

All 80 focused authorization/contract tests passed, including draft defaults, malformed mutation inputs, date filtering and existing draft/tenant/linked-feedback guards. Types (21 tasks), lint (600 files), production build, inventory and diff checks passed. All five live protocol/local-MCP tests passed in 21.53 seconds, retaining release creation/filtering and SDK reads. Twelve inputs and broader service/parity gates remain unfinished.

Both production browser workflows passed in 13.4 seconds: widget releases open directly with accessible compact cards, and publishing an edited draft preserves its latest content and cleared metadata in the widget.


## Settings Effect input and nested patch preservation

The final settings input now uses Effect contracts, bringing coverage to 39/50 inputs and 50/50 outputs. Settings updates merge fields within each section instead of replacing a section with parser defaults. Omitted branding, access, feedback, release and domain fields retain their saved values; explicit false values and empty arrays still apply. This fixes partial updates resetting unrelated preferences. Concurrent-edit revision protection remains unfinished.

All 82 focused authorization/contract tests passed, including nested preservation and invalid field rejection before metadata reads. Types (21 tasks), production build, inventory and diff checks passed. All five live protocol/local-MCP tests passed in 21.10 seconds, including an agent color update preserving saved accent/logo values. A new browser test passed in 5.6 seconds: dashboard save/reload preserves the accent and an unrelated feedback setting, and portal/widget CSS branding variables receive the saved colors. This is propagation evidence, not full visual acceptance of every branded component.

Final lint passed across 601 files, including the new appearance browser test.


## Complete catalog input migration

The remaining eleven feedback operations now use Effect inputs. All 50 catalog operations have Effect input/output contracts; contract tests require an Effect input for every catalog entry and independently compile its discovery schema. Feedback inputs preserve title/description limits, category/status choices, vote values, revision checks, default page size and UTC cursor strings without reducing microsecond precision. Repository adapters copy readonly status arrays. Internal public-index and connection-approval operations outside the catalog still use compatibility validation.

All 84 focused authorization/contract tests passed, including all eleven malformed-feedback entry points rejected before repository reads and cursor/default-page-size checks. All 21 typechecks, lint (601 files), production build, inventory and diff checks passed. All five production protocol/local-MCP tests passed in 20.99 seconds, retaining SDK identification/submission/voting, agent replies, retries and revocation. Catalog contract completion does not establish full Effect service extraction, exhaustive cross-interface behavior/authorization parity, or the remaining release gates.

The production feedback browser flow passed in 17.7 seconds, including thread/reference interaction and responsive/theme accessibility checks.


## Effect-only operation input boundary

Internal public-index and human approval operations now use Effect inputs as well. The operation type requires an input contract, default procedure inputs use Effect schemas, and the legacy Zod execution/contract-generation branch and `.input(...)` builder are removed. Zod remains only as the tRPC parser shim delegating to the Effect contract. Public catalog coverage stays 50/50; internal authentication ceremonies remain outside agent capabilities.

All 88 focused authorization/contract tests passed. New internal checks cover public indexing input bounds, invalid approval codes/actions, human-session requirements, agent denial, and forwarding both approve/deny decisions through the auth adapter. All 21 typechecks, lint (601 files), production build, inventory and diff checks passed. All five live protocol/local-MCP tests passed in 22.87 seconds. Business handlers still require fuller Effect service extraction; this completes the input boundary, not the full architecture goal.

The production public SEO browser flow passed in 15.3 seconds, verifying public content without JavaScript and exclusion of private feedback/draft releases from indexing.


## Profile Effect service and injectable repository

Profile reads/updates now compose Effects through an application-owned `ProfileRepository` Context service. Only its infrastructure adapter imports database queries. The shared operation builder accepts Effect-returning handlers and preserves typed failures; the transport runtime supplies the live repository layer alongside authorization. Existing async handlers remain supported for incremental service extraction.

All 90 focused authorization/contract tests passed, including injection of a repository without calling the database adapter and preservation of a typed repository conflict. Root tests use the same pinned Effect 4.0.0 dependency. All 21 typechecks, lint (603 files), production build, inventory and diff checks passed. All five production protocol/local-MCP tests passed in 20.93 seconds, including profile access over MCP. This establishes the service extraction pattern for profile only; remaining business services still need migration.

The production profile browser save/reload/API-parity and accessibility flow passed in 10.8 seconds.


## Reference and activity Effect service extraction

Reference list/add/delete and activity reads now compose Effects through an application-owned repository service. Infrastructure owns database calls and typed I/O error mapping. Application logic still checks post organization before list/add, assigns the current author and scopes deletion by organization. The transport runtime provides the live layer alongside authorization/profile services.

All 91 focused authorization/contract tests passed, including an injected foreign-post repository proving that authorization prevents the write before database access. All 21 typechecks, lint (605 files), production build, inventory and diff checks passed. All five live protocol/local-MCP tests passed in 20.81 seconds, retaining reference retry behavior and foreign-scope rejection. Remaining service groups still need extraction; contract coverage stays 50/50.

The production feedback/reference browser flow passed in 17.9 seconds, including responsive/theme accessibility checks.


## Organization and invitation Effect service extraction

Organization and invitation operations now compose Effects through `OrganizationRepository`. Database calls live in infrastructure; the application retains workspace filtering, slug conflicts, owner attribution, onboarding merging and invitation state rules. Invitation expiry uses the Effect clock. Onboarding initialization/update now return NOT_FOUND if the write finds no organization, instead of reporting false success.

All 93 focused authorization/contract tests passed, including preservation of completed onboarding steps and the missing-row write regression. All 21 typechecks, lint (607 files), production build, inventory and diff checks passed. All five live protocol/local-MCP tests passed in 22.44 seconds, including organization creation and agent invitation/cancellation flows. Remaining service groups and release acceptance gates remain unfinished.

The production Members browser workflow passed in 12.4 seconds, including dashboard/API invitation consistency and responsive/theme accessibility checks.


## Settings and membership Effect service extraction

Settings, membership and organization-delete handlers now compose Effects through OrganizationRepository and MembershipRepository. Database access remains in infrastructure. The adapter translates membership transaction failures into typed errors; final-owner, tenant and role checks remain in the existing locked PostgreSQL transaction. Exact-name confirmation and owner-only organization deletion remain application rules.

All 101 focused authorization/contract/PostgreSQL tests passed, including concurrent final-owner demotions, tenant-scoped member changes and settings patch preservation. One deletion unit fixture was corrected to return a Promise, matching the database adapter. All 21 typechecks, lint (609 files), production build, inventory and diff checks passed. All five live protocol/local-MCP tests passed in 19.87 seconds. Other service groups and release gates remain unfinished.

Both production browser flows passed in 14.9 seconds: branding save/reload and public-variable propagation, plus Members dashboard/API consistency and responsive accessibility checks.


## Credential Effect service extraction

Credential operations now compose Effects through CredentialRepository. Application logic retains permission checks and the active-key count check; infrastructure owns key generation, hashing, preview generation and persistence. Output contracts continue to remove hashes and expose a raw key only on creation. The existing count-before-create quota remains non-atomic under concurrent writes.

All 95 focused authorization/contract tests passed, including rejection at the active-key limit before storage and sanitization of infrastructure failures. All 21 typechecks, lint (611 files), production build, inventory and diff checks passed. All five live protocol/local-MCP tests passed in 18.98 seconds, including dated key creation via MCP and SDK credential boundaries. Remaining service groups and release gates remain unfinished.

## Technical focus and icon restoration — October 3

Restored marketing source/layouts to origin/main and saved the displaced source patch in `.context/landing-before-restore/`. The only remaining marketing source differences are two icon API/type compatibility fixes. Shared UI changes from earlier work still affect shared primitives. Pro bulk/duotone/solid imports and ^4.0.0 declarations are restored. The install hook selects actual Pro packages when HUGEICONS_TOKEN is exported, otherwise free package aliases for community installs. The community frozen install passed. Pro selection and credential isolation have unit coverage; a real Pro registry download is unverified because this workspace has no token.

Feedback, changelog, connections/approval, and public indexing now compose Effects over injected repositories. The operation builder requires Effect handlers, and a new architecture test rejects direct database imports in these product handlers. Added generated types for all 50 operation inputs/outputs, compile-time negative fixtures, typed authenticated calls, and a lazy feedback-page iterator. CI checks generated client drift. Live protocol tests now spawn the real CLI for authenticated reads, file-input writes, deterministic JSON and cross-organization denial.

Repeated OAuth MCP runs exposed a schema-validator cache bug: a tenant-specific organization constant reused the same schema ID across workspaces. Each scoped input schema now has a distinct ID. Two consecutive independently authorized workspaces verify this regression on the same production server.

Final verification:

- `pnpm install --frozen-lockfile`: passed, community edition (2.7s).
- `pnpm build`: all 12 workspace build tasks passed (49.297s), including restored landing and published SDK builds.
- `pnpm typecheck`: all 21 tasks passed (8.819s).
- `pnpm lint`: 624 files passed.
- `pnpm capabilities:check`: 50 operations, 45 dashboard/server-action references, 14 auth call types.
- `pnpm client:check`: generated contracts match and compile-time negative fixtures pass.
- `TEST_DATABASE_URL=postgresql://vercel-sandbox@127.0.0.1:55432/userbubble_test TEST_APP_URL=http://127.0.0.1:3002 pnpm test`: 134 tests passed, none skipped (19.97s).
- `TEST_APP_URL=http://127.0.0.1:3002 pnpm exec playwright test --grep-invert 'marketing is accessible'`: all 8 browser flows passed (43.3s), including existing responsive/theme accessibility assertions.
- `git diff --check`: passed.

Initial live runs failed because the local PostgreSQL process was stopped; restarting the database and application resolved that environment failure. Initial full browser runs also hit production signup rate limits. Fixtures now honor bounded Retry-After delays without disabling the production limit. The MCP cache failure was reproduced before the fix and passed afterward.

This is not full-goal completion or approval to resume UI/UX. Delegated execution still needs extraction from its Promise/DB coordinator, permission policies remain partly in infrastructure query helpers, atomic credential quota enforcement and settings revisions remain open, and exhaustive per-operation cross-interface success/denial coverage and remaining release/performance/mobile gates are not complete. No production migration, deployment, commit or push was performed.

## Effect 4 coordinator and server-boundary migration — October 3

Cloned upstream Effect to `~/.repos/effect` at `480bba2dfebba5b0e58695a9837895dfb65895ee` and used its `LLMS.md` and runtime/service/resource guidance. The workspace remains pinned to Effect `4.0.0`.

Delegated authorization, target-tenant checks, operation execution, receipts and audit orchestration now compose Effects. One ManagedRuntime supplies application services. The Drizzle callback bridge retains transaction context and interruption propagation; a real PostgreSQL regression proves rollback and concurrent retry deduplication through the Effect adapter. Application errors use Schema.TaggedError. Shared permission policies and organization settings schemas no longer depend on database modules.

Server-rendered organization, feedback and release reads now use application read models. Organization results exclude installation secrets. Removed unused legacy tRPC authorization middleware and database context access. SDK identification uses an injected Effect service for credential resolution and persistence while preserving the transport contract. Added policy and identification regressions, including denial of private-feedback voting by authenticated nonmembers. Architecture checks cover all application/contracts modules and direct repository imports throughout the main app.

Verification against the rebuilt production app:

- `pnpm install --frozen-lockfile`: passed, community icon fallback, 2.7 seconds.
- `pnpm build`: all 12 tasks passed, 40.827 seconds.
- `pnpm typecheck`: all 21 tasks passed, 14.536 seconds.
- `pnpm lint`: passed, 637 files.
- `pnpm capabilities:check`: 50 operations, 45 dashboard/server-action references, 13 native auth call types.
- `pnpm client:check`: 50 generated contracts match; compile-time fixtures pass.
- `TEST_DATABASE_URL=postgresql://vercel-sandbox@127.0.0.1:55432/userbubble_test TEST_APP_URL=http://127.0.0.1:3002 pnpm test`: 143 passed, none skipped, 21.70 seconds.
- `TEST_APP_URL=http://127.0.0.1:3002 pnpm exec playwright test --grep-invert 'marketing is accessible'`: 8 passed, 41.9 seconds.
- `git diff --check`: passed.

Evidence logs are saved under `.context/effect-migration/`. Initial compile failures from the server-read extraction and a test's incorrect receipt column name were fixed before the passing runs above.

Scope: all catalog product handlers, delegated orchestration and server read models compose Effects. Framework transports, React state, Drizzle drivers/transaction callbacks, and Better Auth authentication ceremonies retain their native Promise APIs. This is not a claim that every asynchronous function in the monorepo has been converted. Marketing and visual design were not changed in this migration.

The broader revamp is still unfinished: atomic credential quota enforcement, settings revision checks, exhaustive per-operation cross-interface parity, remaining performance/mobile acceptance and production migration/restore rehearsal remain release gates. No production migration, deployment, commit or push was performed.

## Shared execution and release revisions — final verification

This technical checkpoint adds shared user/agent receipts and atomic audit writes, typed database deadlines and pool disposal, request correlation, and release revision checks through migration 0015. The focused database/contract run passed 28 tests; the focused authorization run passed 94 tests; the four live direct-execution regressions passed after fixing request-ID propagation. The first complete shared-execution run passed 196 checks and failed one dashboard fixture assertion that incorrectly expected a published release to remain private. That assertion and a rate-limit-sensitive test timeout are corrected; the clean full run passes all 197 tests, with none skipped, in 528.58 seconds. Earlier totals above describe earlier checkpoints.

The populated migration and backup restoration were repeated against new disposable databases, including preservation of an existing published release and its revision backfill. Build (12 tasks), typecheck (21 tasks), lint, generated client and capability inventory passed for that checkpoint. No deployment or GitHub CI run is claimed.

The rebuilt app passed all nine browser workflows in 44.7 seconds after the execution/deadline changes. Logs for this checkpoint are retained in `.context/effect-final/shared-execution/`. Deferred auth-client loading is a subsequent browser-only optimization and still needs its own build/browser/performance check.

## Portal behavior and documentation discovery — October 3

Public roadmap voting now receives the authenticated session and uses correct path-based or subdomain thread links. Portal auth keeps the current page as its callback and refreshes server-rendered permissions after login/logout. The new browser scenario exercises vote/unvote, thread navigation, first-use login and feedback dialogs, preserved composer drafts, submission, and voting after portal login.

Closed portal dialogs defer their form modules until first use; they stay mounted afterward to preserve close transitions and drafts. Documentation has a configured metadata origin, per-page canonicals, Open Graph URLs, robots and a source-generated sitemap. The docs browser check requests every indexed URL and verifies canonical server-rendered content. CI now starts the production docs server and runs that check.

All 11 browser workflows pass together in 55.3 seconds. The build (12 tasks), typecheck (21 tasks), lint (669 files), and whitespace check pass after these changes. The earlier full 197-test application/protocol result remains the service checkpoint; no shared operation implementation changed in this portal/docs pass. Evidence is `.context/effect-final/portal-docs/`.

An intermediate server restart used the wrong authentication secret for the populated local signing-key table; restoring the matching verification secret resolved it. No signing keys were deleted, no encryption was weakened, and temporary diagnostic logging was removed before the final build.

The 15-sample deferred-dialog performance check reduces thread JavaScript to 469,715 bytes and roadmap JavaScript to 444,625 bytes, but paint timing still exceeds the requested threshold. This is progress in payload size, not performance completion; see [the performance report](performance.md).
