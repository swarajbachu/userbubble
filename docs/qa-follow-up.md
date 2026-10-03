# PR #20 functional verification follow-up

The page inventory contains 26 application page routes. Browser coverage now includes signup, profile completion, onboarding, profile editing, all three connection screens, ten organization routes, six public portal routes, and three embedded routes. The route sweep checks successful document responses, expected content, uncaught browser exceptions, all six settings tabs, and an embedded feedback submission appearing in the dashboard. Connection approval/consent pages exercise invalid-link behavior here; successful authorization and delegated execution remain covered by the protocol suite.

The signup journey found two onboarding defects: domain-only website input did not satisfy the application URL contract, and the post-creation server action was intercepted by the root onboarding redirect. Website input now normalizes to an HTTP URL before submission; initialization uses the authenticated tRPC operation. Invalid website input blocks progression. Missing agent approval/consent parameters now display invalid-request states without indefinite request loading. Vercel analytics loads only on Vercel, avoiding an HTML-as-JavaScript error on self-hosted servers.

Local verification after the fixes:

- Production build: 12 packages passed.
- Typecheck: 21 packages passed.
- Lint: passed.
- Browser suite: 12 tests passed initially; the new route sweep initially had incorrect expected text for portal/widget entry pages. After correcting those assertions and adding widget submission verification, the route sweep passed, yielding 13 passing tests across those runs.
- Existing browser checks cover responsive themes/accessibility, feedback threads, public SEO without JavaScript, all indexed documentation pages, replies/references, voting, credentials, member invitations, profile edits, branding, and changelog publishing.
- The previous GitHub Verify run (37133558758) passed its full application job, including 201 service/contract/protocol tests, builds, mobile export, migration/restore, and browser checks. A fresh PR run is required for this follow-up commit.

These checks are evidence for the tested paths, not a claim that every possible interaction or real-device native journey has been exhaustively exercised. Marketing remains unchanged.

The three Vercel preview checks were failing before this follow-up. Their authenticated build logs were unavailable in the cloud workspace; the deployment API returned 403 and no Vercel CLI was installed on the user's Mac. The deployment failure cause remains unconfirmed. GitGuardian's disposable CI credential finding is intentionally untouched at the user's direction; scanning remains enabled.

## Vercel install follow-up

The supplied deployment log confirmed `ERR_PNPM_LOCKFILE_CONFIG_MISMATCH`: token-enabled Pro overrides differ from the committed community lockfile. All three Vercel projects now run the shared install script, which keeps community installs frozen and explicitly resolves the Pro edition in token-enabled deployment checkouts. An actual frozen community install passed; subprocess tests cover every project's install command, both edition selections, whitespace-only tokens, and failure propagation. Licensed package downloads still require deployment verification with a valid registry token.

The follow-up GitHub run also identified generated capability-inventory drift from the new onboarding tRPC call. The inventory was regenerated; capability and typed-client consistency checks pass.

## Signup cooldown regression

Run 37137999241 passed the service/build gates but failed the browser signup journey. The real production signup limiter was reproduced locally: three preceding attempts from the same IP cause the form submission to receive 429 with `Retry-After: 10`. Both API fixtures and the UI signup helper now honor that bounded cooldown, retry only explicit 429 responses, and preserve failures for other responses. The onboarding regression intentionally fills the rate-limit bucket, asserts the first browser submission is throttled, then completes signup through the real form. Production rate limits remain unchanged.

The workflow now specifies the PostgreSQL health-check user/database and includes the explicitly listed hidden `.context` evidence files in artifact upload. Previous artifact uploads silently omitted the browser traces and server logs. All three Vercel previews passed after the install fix.
