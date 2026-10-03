# Changelog

## Unreleased

- Keep SDK release installs reproducible with the committed community icon lockfile, while retaining Pro opt-in for application builds.

- Reuse the request-scoped cookie-session lookup in server-rendered tRPC calls without permitting explicit credentials to fall back to cookies.

- Scope auth, error, public portal and widget styles separately from the full product utility bundle while retaining shared theme rules and existing rendered appearance.

- Bound server-rendered read compositions with the shared Effect deadline, independently of individual SQL statement limits.
- Fetch independent public-layout organization and session reads concurrently, retaining membership authorization.
- Load only the portal navigation's animation features and derive its active tab directly from the URL to avoid an extra render.

- Restore signed-in voting and correct thread links on public roadmaps. Load portal auth/submission dialogs on first use while retaining their drafts and close transitions.
- Add documentation canonicals, production metadata URLs, robots and a generated sitemap, with a check of every indexed page.

- Share transactional retry receipts and audit records across dashboard, direct API and delegated agents; restore Date values on cached replies and correlate activity with request IDs.
- Add PostgreSQL statement/lock limits, typed transient failures and scoped pool cleanup, with cancellation and rollback tests.
- Add revision checks for changelog edits, publication, feedback links and deletion, plus organization edits. Preserve historical release content with an additive revision migration.

- Prevent foreign-origin tRPC requests from using account cookies, and prevent explicit credentials from falling back to cookie authentication.
- Publish organization and retry metadata consistently for agent discovery, OpenAPI and MCP, with matching typed-client constraints.
- Remove raw authentication error logging and avoid loading product query providers on sign-in screens.


### Application and agent access

- Share Effect 4 application services and validated contracts across the dashboard, management API, CLI, and MCP.
- Add authenticated capability discovery, a generated typed client, Agent Auth delegation, OAuth MCP, connection revocation and activity records.
- Add cursor-based feedback search, implementation references, retry receipts and optimistic feedback revisions.
- Protect settings updates with `expectedRevision` and expose `settingsRevision` in organization responses. Concurrent writes return a conflict instead of silently overwriting changes.
- Preserve onboarding progress with atomic patches, including concurrent step updates.
- Reject primitive inputs consistently across all operation contracts.
- Return actionable rate-limit and transient errors through the management client, CLI and local MCP.
- Enforce the ten-active-key limit transactionally for both key creation and reactivation.
- Remove hosted model and repository execution. Preserve historical comments and implementation links during migration.

### SDKs, widgets and public content

- Preserve web and React Native SDK identification, feedback, voting and changelog endpoints with isolated installation credentials.
- Block embedded identities from inheriting workspace membership or claiming registered workspace accounts.
- Load optional React Native storage adapters on demand, preserving custom-storage and single-adapter installations. Avoid logging token-bearing portal URLs.
- Correct SDK CommonJS exports and ship compiled CLI/client JavaScript.
- Configure the native app through deployment URL and installation-key environment variables; reject missing keys before network requests.
- Keep database and server Effect validation modules out of browser bundles through dedicated browser-safe form and enum exports. Use Zod Mini for browser feedback forms and avoid schema-library imports for the three-value theme setting.
- Serve public feedback, roadmap and releases as indexable HTML with canonical metadata, structured data, sitemaps and RSS. Keep drafts, private feedback and management pages out of public indexing.
- Open published releases directly from widgets and sanitize rendered release content.

### Upgrades

- Pin Effect 4.0.0 and Better Auth 1.7.7; use compatible Drizzle 0.45.3.
- Update Next.js to 16.3.8, MCP server to 2.3.0 and MCP SDK to 1.32.0.
- Upgrade mobile to Expo 57 / React Native 0.86.3 with matching native dependencies and production URL configuration. Use Expo’s default Metro cache so isolated native release builds work without an undeclared dependency.
- Update the shared React 19.2 patch and Zod versions; align auth dependency resolution so typed errors survive plugin boundaries.

See `docs/upgrade.md` before applying database migrations. This unreleased entry describes implemented work, not a production rollout or completion of all acceptance gates. UI/UX changes are tracked separately.
