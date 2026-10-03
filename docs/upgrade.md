# Agent platform upgrade

1. Back up PostgreSQL with `pg_dump -Fc` and rehearse `pg_restore` into a separate database. Verify feedback, comments, votes, memberships, branding, and implementation links.
2. Stop accepting hosted execution work, drain or cancel running jobs, and disable external callback producers. Revoke model/repository credentials in their issuing services.
3. Deploy the compatible application release and apply reviewed migrations during a maintenance window. The agent-platform migration preserves historical PR links and activity before deleting provider credential and execution tables.
4. Verify sign-in, organization membership, SDK identify/session exchange, feedback submission, and changelog reads. Connect a test agent and verify organization constraints, grant revocation, and restricted roles.
5. Remove obsolete worker deployments and their environment secrets. Retained backups may contain old credentials; handle them according to your existing backup retention policy.

After destructive cleanup, rollback requires both the previous application and a database restore. Do not run the previous worker against the new schema.

## Deployment URLs and sessions

Set `NEXT_PUBLIC_APP_URL` to the application's public origin before building and running it. Google OAuth uses this resolved application origin for `/api/auth/callback/google`; register that callback with the provider.

Set `NEXT_PUBLIC_BASE_DOMAIN` to the domain you control for organization subdomains (for example, `example.com`, without a scheme or port). In production over HTTPS, session cookies are shared only when the application host is that domain or one of its subdomains. Preview hosts outside that domain, deployments without a base domain, and local HTTP instances use host-only cookies. An unrelated configured domain must never prevent sign-in. Do not configure a public hosting suffix or a domain with untrusted subdomain operators as the shared domain.

When migrating from the former hardcoded `.userbubble.com` cookie domain, existing sessions on another deployment may require signing in again. The session database is preserved. CI runs browser and protocol acceptance against `next start`, so production cookie behavior is exercised rather than relying on development-mode behavior.

## Settings revisions and SDK artifacts

Apply `0014_settings-revisions.sql` before running this application version. It adds a revision initialized to 1 without rewriting customer metadata. Agents should read `organization.get`, then pass its `settingsRevision` as `expectedRevision` to `settings.updateSettings`. On conflict, read again and reconcile before retrying.

Web and core SDK packages expose CommonJS through `.cjs` and ESM through `.esm.js`; standard package imports remain unchanged. The CLI now executes built JavaScript, so run `pnpm build` before using its local bin. Published artifacts no longer require a runtime TypeScript loader or the internal TypeScript configuration package.

Copy `apps/expo/.env.example` to `apps/expo/.env.local`. Run native development with `pnpm ios` or `pnpm android` from the workspace root. Set `EXPO_PUBLIC_APP_URL` and `EXPO_PUBLIC_USERBUBBLE_API_KEY` before building a self-hosted mobile app. The latter must be an SDK installation key from the selected workspace, not a management credential. Production requires HTTPS and defaults to `https://app.userbubble.com`; development can infer the Metro host. Native auth redirects use the `userbubble://` scheme. Rebuild the native development client after an Expo SDK upgrade.


The additive `0015_changelog-revisions.sql` migration backfills every release with revision 1. It does not modify release content, publication state or links. The populated rehearsal now includes a historical published release and checks it after migration and after restoring the legacy backup.

The application pool now has server statement/lock limits. Review the four `DATABASE_*_TIMEOUT_MS` values in `.env.example` against deployment latency; invalid or disabled values fail startup rather than silently allowing unbounded waits. Run migrations through their administrative connection. Successful audit writes are transactional with management mutations: unavailable audit storage causes a rollback rather than an unaudited successful write.

Receipt input normalization now includes the current membership authority and restores typed dates. Existing receipt keys created before this execution-boundary upgrade may conflict; reconcile the original result before choosing a new key. API-key operations still reject retry keys and never store raw credential responses.

## Preserve authentication secrets across restarts

Keep `AUTH_SECRET` stable for an existing database, including a local verification database. Better Auth encrypts stored signing keys with it; changing only the environment secret can leave signup working while authenticated product requests fail when those keys are decrypted. Restore the matching secret rather than deleting signing keys or weakening encryption. Treat deliberate secret rotation as a separate, rehearsed authentication migration.

The documentation build accepts `NEXT_PUBLIC_DOCS_URL` for its canonical origin. The default is `https://docs.userbubble.com`. Rebuild documentation after changing it. Browser verification accepts `TEST_DOCS_URL` pointing to the local production docs server; CI starts that server on port 3005 and checks every sitemap URL.
