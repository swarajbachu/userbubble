# Application boundaries

Dashboard tRPC, management HTTP, and Agent Auth dispatch to the operation catalog in `packages/api/src/application/catalog.ts`. Each operation owns validation, access classification, and behavior. The runtime is the Promise boundary for Effect programs. Existing SDK routes retain their v1 contracts during migration.

Agent Auth checks signed requests, audience, live grants, constraints, and revocation. Delegated execution additionally resolves the real user, current organization membership, and target resource's organization. Every agent capability requires an organization constraint. SDK installation keys and embedded customer tokens cannot authenticate management access.

Repositories in `packages/db` participate in the current AsyncLocalStorage transaction. Idempotency receipts use transaction-scoped PostgreSQL advisory locks, so concurrent retries across processes share a result and rolled-back writes cannot leave a successful receipt. Credential creation intentionally does not persist a raw-key response in receipts.

Historical migrations are immutable. The agent-platform migration copies historical implementation links and activity before removing hosted execution tables. Comment provenance remains intact. Run the migration rehearsal against an empty local disposable database; never point the rehearsal at a deployed database.

## Verification

- `pnpm test`: authorization regression suite.
- `pnpm typecheck`: workspace TypeScript checks.
- `pnpm build`: production builds.
- `TEST_DATABASE_URL=postgresql://... bash scripts/verify-migration.sh`: populated legacy migration rehearsal.

The full cross-interface parity, browser, and performance gates remain required before release. A service catalog entry alone is not evidence of full acceptance coverage.

OAuth MCP uses Better Auth's OAuth provider and the official MCP server transport. Tokens are bound to a selected organization; the MCP boundary verifies their signature, issuer, audience, scope and expiry, then checks live consent and current membership for each execution. The same delegated operation executor serves OAuth and Agent Auth. The consent/revocation repository lives in the infrastructure layer.

`feedback.search` provides full-text matching of titles/descriptions, status/category filters, incremental `updatedSince`, and keyset pagination ordered by update timestamp and ID. Cursors retain PostgreSQL microseconds. Feedback updates accept `expectedRevision`; stale revisions produce a conflict while older SDK callers remain compatible.

## Output contracts

New output contracts live in `packages/api/src/contracts/outputs.ts` and use Effect Schema. Apply them with `.output(schema)` after input composition and before `.query(...)` or `.mutation(...)`. The shared operation decodes the handler result inside its Effect program, strips unmodelled object fields, and maps malformed results to a generic `INTERNAL_SERVER_ERROR`. Never put repository payloads or schema issue details into a client-facing error.

Capability discovery, Agent Auth capability metadata, and OpenAPI derive output descriptions from the same schema. Generated output objects are closed because the operation returns the projected result, not the original repository object. Date fields remain valid Date objects internally and serialize as strings over JSON. Named definitions are scoped to stable schema resource IDs; OpenAPI response envelopes place definitions at their own resource root so local references resolve correctly. Ajv compiles and validates the generated invitation response schema in the contract tests. The client exposes `outputSchema`, and the checked capability inventory records `outputValidated` for each operation.

All 50 catalog operations now validate their outputs with Effect Schema. The contract test requires every catalog operation to declare a schema and independently compiles its generated output and OpenAPI response schemas. Organization, feedback, release, credential, and connection projections strip unmodelled fields; anonymous author email is excluded from feedback outputs. Nullable historical authorship is preserved. API-key creation returns its raw key once. Remote MCP publishes the same contracts as object envelopes containing `data`, validates JSON-normalized results, and returns matching structured content and JSON text. Capability discovery also publishes the response envelope schema; local MCP uses it to expose named product tools with explicit connection IDs and structured results. Catalog contracts alone do not establish full per-interface behavior/authorization parity. Generated per-operation client types are checked separately with `pnpm client:check`.


### Effect input migration

Use `.effectInput(contract)` with a complete Effect schema before `.output(...)`. Inputs decode inside the shared Effect program and failures become a generic BAD_REQUEST. The retained Zod parser is only the tRPC compatibility adapter and delegates to that same schema; do not add independent validation rules to it. The operation builder accepts Effect contracts only; it has no legacy `.input(...)` validation path. Internal public-index and connection-approval inputs use the same boundary. Organization contracts must include organizationId.

All 50 catalog operations have Effect input and output contracts. Contract tests require an input contract for every catalog operation and compile its published schema. Settings patches merge each nested section; omitted fields retain their saved values, while explicit false values and empty arrays are applied. Optional JSON properties use `Schema.optionalKey`; explicit null is permitted only where the contract declares it. The shared input boundary omits explicit `undefined` object properties preserved by SuperJSON, matching JSON transport behavior while retaining native Date values. Capability discovery and remote MCP derive migrated input schemas from the encoded side of the Effect contract. Runtime checks and transformations remain authoritative where JSON Schema cannot express them. The inventory records `effectInput` per operation so output coverage cannot be mistaken for input migration completion.

## Effect repository services

Application handlers may return an Effect directly. The operation builder composes it into validation/authorization/output projection without running a nested runtime. `application/runtime.ts` provides the live infrastructure layers at the transport boundary. All product handlers now return Effects; the operation builder no longer accepts standalone Promise handlers.

Profile reads/updates use `ProfileRepository`, an application-owned Context service whose methods return typed Effects and contract-shaped data. The live adapter in `infrastructure/profile.ts` owns Drizzle query calls and translates unknown I/O failures to application errors. Tests can supply an in-memory repository with `Effect.provideService`; they do not need to replace database imports. Repositories are supplied at the shared runtime so handlers can be tested with injected services.

Implementation references and activity reads use `ReferenceRepository`. The application checks the referenced post's organization before list/add, assigns the authenticated author, and scopes deletion by organization. The infrastructure layer maps repository calls to typed Effects. The live layers remain composed at the transport runtime; service methods do not call `runPromise`.

Organization and invitation operations use `OrganizationRepository`. The application owns delegated workspace filtering, slug conflict handling, owner attribution, onboarding state merging and invitation cancellation rules. Invitation expiration uses the Effect clock. The infrastructure layer retains transactional owner creation and conditional cancellation queries. Onboarding writes check their returned row instead of reporting success after a concurrent organization deletion.

Settings and membership handlers also compose Effects. Settings writes compare and increment the organization’s settingsRevision atomically; callers may send expectedRevision to detect changes since their last read. Settings updates and organization deletion reuse `OrganizationRepository`; member listing/mutations use `MembershipRepository`. The membership adapter maps the transactional query's domain failures into typed Effect failures. Final-owner serialization and target/actor tenant checks remain inside the locked SQL transaction; this boundary must not be replaced with a nontransactional read/check/write sequence.

Credential operations use `CredentialRepository`. The application checks membership/management authority and the existing active-key count limit; infrastructure owns random key generation, hashing, masked previews and persistence. Only the creation result carries a raw key. The persistence adapter locks the organization row before counting and creating or reactivating keys, so competing writes share the same ten-active-key quota. Re-enabling an already active key is idempotent.


Feedback, changelog, connection management/approval, and public index handlers now use injected Effect repositories. Infrastructure owns database and Better Auth I/O. Changelog enrichment uses controlled concurrency (eight entries), and publication timestamps use the Effect clock. The approval adapter requests an explicit HTTP response from Better Auth and validates its JSON before returning application data. Existing SQL transaction boundaries remain intact.

The service builder only accepts Effects. Architecture tests now cover every application and contract module, rejecting database imports, infrastructure imports and nested runtimes outside the shared runtime. They also reject direct repository access anywhere in the Next.js application's source. Application services contain no async functions. Full authorization/behavior parity remains a separate acceptance gate.

### Upstream guidance and execution boundaries

Effect is pinned to `4.0.0`. This migration was checked against `Effect-TS/effect` commit `480bba2dfebba5b0e58695a9837895dfb65895ee`, cloned to `~/.repos/effect`, using its `LLMS.md`, service, runtime, error and resource examples. Use `Effect.gen` to compose operations, `Effect.fn` for traced workflows, Context services for dependencies, and Schema tagged failures. Ordinary React state and third-party framework callbacks keep their native APIs.

One `ManagedRuntime` composes the live repositories. `runtime.ts` exports Promise adapters for transports and server components; application workflows compose Effects without running them. Drizzle and Better Auth remain Promise-based external dependencies behind adapters. The Better Auth plugin's session/cookie and cryptographic authentication ceremonies remain native framework integrations; this migration does not replace Better Auth's execution model.

Delegated execution now resolves current identity and membership with controlled concurrency, checks resource ownership, executes the shared operation, records outcomes and applies receipt handling as Effects. `DelegationRepository` owns the infrastructure seam. Its receipt adapter is the one deliberate callback bridge: it captures the Effect context and runs the work inside Drizzle's transaction callback with the interruption signal. The database AsyncLocalStorage transaction remains active across Effect execution. A PostgreSQL regression verifies injected failure rollback, context propagation and concurrent retry deduplication through this bridge.

Feedback visibility/modification/participation and credential membership/admin checks now live in application policies. Voting also requires visibility of the target feedback. Pure organization settings and slug schemas live in `packages/validators`, independent of database packages. Existing database exports re-export these utilities for compatibility.

Server read models share these policies and repositories for organization context, feedback threads, releases and OAuth consent. Organization reads project the public contract before returning data to React, excluding installation secrets. SDK `/api/identify` persistence and credential resolution use an injected Effect service, preserve the existing HTTP shape and never return management authority. Its legacy transport parser retains the published field-error format; the service also validates its Effect input contract. Last-used telemetry is awaited within the operation and handled as best-effort I/O, replacing a detached Promise.

Client input/output types are generated from published schemas into a standalone client package without importing server services or database dependencies. The generator isolates per-operation definitions and CI checks for drift. Agent calls require organization context even where the corresponding dashboard operation uses the current session alone.

Onboarding writes use an atomic JSONB patch in the organization repository. Initializing an existing checklist preserves completed steps; concurrent updates to different steps do not overwrite one another. The application passes only the changed steps.

### Browser dependency boundary

Browser form schemas use `zod/mini` and are checked against the Effect input contract. The three-value theme setting uses a direct string guard. Client components import feedback enums and form validators through `@userbubble/validators/feedback-model` and `/feedback-form`. Slug validation uses `/slug`. Settings decoding through `/organization` stays on the server; server components pass parsed settings into forms. Never import runtime values from database schema barrels into client components: those barrels can pull database drivers and server Effect schemas into the browser. Type-only database imports are erased and remain permitted. Architecture tests enforce the direct-import boundary, and production chunk inspection verified that server Effect modules are absent.


## Browser and agent transport boundaries

`tRPC` discards ambient cookies from foreign-origin requests while retaining explicitly supplied SDK tokens. Same-origin/application-origin requests and native requests without an Origin header retain normal session validation. Any explicit Authorization header fails closed if its scheme/token is unsupported or verification is unavailable; it never falls back to a cookie. Shared application authorization still decides resource access.

Agent discovery, OpenAPI, Agent Auth and MCP use the catalog's agent input schema. Every delegated call selects an organization. Remote MCP can infer that organization from its bound OAuth consent, while rejecting a conflicting explicit selection. Retry keys are advertised only for supported mutations; credential responses are never persisted for replay. The internal operation schema remains separate from this transport metadata.

Product query/URL-state providers live in product route layouts through `ProductProviders`; authentication screens do not load them. New product routes that use these hooks must include that layout boundary.

Remaining technical acceptance work is tracked in [the completion audit](technical-completion-audit.md); the presence of an Effect catalog is not a claim that all orchestration guarantees are complete.

## Shared management execution

`application/execution.ts` now handles both direct dashboard/API calls and delegated calls. It validates input before resource lookups, resolves the resource's organization, checks current organization authority, and records user/agent attribution with a request ID. Anonymous and installation-authenticated SDK calls retain their public contracts and cannot use management receipts.

Authenticated mutations commit their data, optional retry receipt, and successful audit record in one transaction. An audit-storage failure rolls the mutation back. Failure auditing is best effort outside the rolled-back transaction, preserving the original typed failure. Replays create a new activity record for the new request while returning the original result. Receipt identity separates users from agents, binds the selected organization and operation, and hashes normalized contract input plus current membership identity/role. Changed input or authority produces a conflict. Shared access checks and agent grants still run before replay. Credential operations never persist one-time secret responses.

Retry callers select `organizationId` even for resource-ID-only contracts, so deleting a resource does not lose the receipt's scope. Global profile/connection operations and workspace creation can use the authenticated user's account scope. tRPC preserves execution metadata for the shared boundary; business handlers still receive their Effect contract's projected input. JSON receipt codecs restore Date fields for SuperJSON callers. Request IDs are generated at HTTP ingress and propagated into activity; MCP returns them with structured results.

## Database deadlines and resource ownership

The shared PostgreSQL pool sets connection acquisition (5s), server statement (15s), lock (5s), and idle transaction (30s) limits. Environment overrides are positive millisecond integers up to 300000. These are server-side SQL cancellations, not client-only query timers that might return while a write continues. Drizzle-wrapped timeout and transient driver codes become sanitized `TIMEOUT`/`SERVICE_UNAVAILABLE` application failures, mapped to HTTP 504/503. There is no automatic write retry.

A scoped Effect layer owns pool shutdown through `disposeApplicationRuntime`. Real PostgreSQL tests exercise statement cancellation, lock waits, transaction/receipt rollback, healthy connection reuse, and runtime disposal. A network partition or host shutdown remains an uncertain client outcome: retry supported writes with the same key after connectivity returns. Administrative migrations use their own connection rather than the request pool's limits. Configuration follows the [node-postgres client options](https://node-postgres.com/apis/client) and [PostgreSQL statement/lock timeout semantics](https://www.postgresql.org/docs/current/runtime-config-client.html).

Changelog revision checks cover edits, publication, linking/unlinking feedback, and deletion. Each successful mutation increments the release revision atomically; stale `expectedRevision` values return `CONFLICT`. Organization edits share `settingsRevision` with settings changes. Legacy callers can omit revision fields for compatibility. Membership mutations retain their locked transaction rules, onboarding uses atomic field patches, and profile/credential descriptive fields retain patch semantics.

Management work also has a 30-second Effect deadline. For mutations it is applied inside the database transaction bridge, allowing interruption to reject the transaction and await rollback before returning a typed failure. Public reads have the same Effect deadline; existing anonymous/SDK writes use database statement limits rather than an outer timer around uncommitted work. A regression inserts a real row, interrupts a sleeping Effect workflow, and verifies that the row is absent before the caller receives `TIMEOUT`.

Server read models use `runRead`, which applies the same overall Effect deadline before shared runtime execution. Their individual PostgreSQL statement limits remain in force as well. The runtime regression uses a suspended read to prove that the overall deadline fires even without a database query, then verifies that another read succeeds after cancellation.

## Route stylesheet boundaries

The root `styles.css` scans auth/error components and their shared UI primitives. Authenticated product layouts import `product.css`, which scans the full application and UI library. Public and embed layouts import `public.css`, scanning their routes, shared feedback/thread components and required UI primitives. All three compile the same `style-foundation.css` so product-only theme variables remain available without changing existing classes or appearance. When adding a shared primitive to an auth/error screen, include its source in the relevant stylesheet's `@source` list. Do not move product providers back into the root layout solely to load styles.

Server-rendered tRPC calls reuse React's request-scoped cookie-session resolver. The resolver is supplied only by the server adapter and is evaluated only when no Authorization header is present; explicit credentials continue to fail closed. HTTP transports retain their own session lookup. Membership and resource authorization still execute in application services on every operation.
