# Capability inventory and verification

Run `pnpm capabilities:check` before submitting changes. Regenerate the checked inventory with `pnpm capabilities:generate` and review the diff whenever an operation or call site changes.

`capability-inventory.json` currently records 50 shared operations, 45 dashboard/server-action operation names (including session and approval ceremonies), and 13 direct Better Auth call types. It lists source files and direct repository imports that still require review. It separates interactive grant approval and session projection from delegable product operations. Existing organization-selection and authentication calls remain visible rather than being silently treated as migrated.

The scanner uses TypeScript syntax trees for declared tRPC option calls, direct Better Auth calls, and the existing server-action caller pattern. It rejects unknown operation IDs and unclassified auth calls. A negative fixture verified that both failures are detected. Computed/aliased calls and complete route reachability still require human review; this inventory is not proof that every user-visible operation has passing parity tests.

The operation catalog feeds API v2, CLI discovery, Agent Auth capabilities, and MCP. Catalog presence proves exposure only. The executable lifecycle in `tests/capability-workflows.test.ts` now covers every catalog operation through HTTP, dashboard tRPC, signed Agent Auth, the compiled CLI, local MCP and OAuth remote MCP. Each operation has successful behavior, invalid-input and authorization checks. Anonymous dashboard feedback/release lists intentionally remain public; their authorization checks verify that private feedback and drafts are filtered out. The suite checks its executed operation set against live discovery and writes per-interface evidence under `.context/capability-parity/`. These are runnable examples against isolated local workspaces, not catalog-only assertions. Application tests and PostgreSQL tests separately cover role downgrades, cross-tenant resources, final-owner races, revisions and retries. Refer to `verification.md` for the acceptance evidence and remaining gates.

The Verify workflow runs the inventory check, lint, types, production builds, a populated legacy migration rehearsal, service/database/protocol tests, and main-app/public/widget browser acceptance on a disposable PostgreSQL instance. Browser/protocol checks use the production build through `next start` and an explicitly configured application origin. Performance acceptance remains a separate requirement. The workflow definition has been added locally and is not evidence of a successful GitHub run.

Architecture regression tests prevent reintroducing the known hosted-AI packages/imports and direct repository imports across the main app, application services and contracts. They deliberately leave historical migration files intact. They do not replace a semantic audit for new execution paths.

The unused starter `post` API and unreferenced starter UI were removed. Its legacy database table remains intact, preserving existing data; published feedback SDK routes are unchanged.

## Executed parity report — October 3, 2026

All 50 operations passed success, invalid-input and authorization checks on all six interfaces against the production build and disposable PostgreSQL fixtures. Each cell represents those three checks; public dashboard lists use private-content filtering as their authorization assertion. Raw run reports are uploaded by CI from `.context/capability-parity/`. This local run completed as part of the 201-test suite during PR preparation; local success is not a claim about GitHub CI results.

| Operation | Dashboard | API | Agent Auth | CLI | Local MCP | Remote MCP |
| --- | --- | --- | --- | --- | --- | --- |
| `account.getProfile` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `account.updateProfile` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `activity.list` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `apiKey.create` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `apiKey.delete` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `apiKey.list` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `apiKey.toggleActive` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `apiKey.update` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `changelog.create` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `changelog.delete` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `changelog.getAll` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `changelog.getById` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `changelog.linkFeedback` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `changelog.publish` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `changelog.unlinkFeedback` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `changelog.update` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `connection.list` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `connection.listOAuth` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `connection.revoke` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `connection.revokeOAuth` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `feedback.create` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `feedback.createComment` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `feedback.delete` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `feedback.deleteComment` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `feedback.getAll` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `feedback.getById` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `feedback.getComments` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `feedback.search` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `feedback.update` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `feedback.updateStatus` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `feedback.vote` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `organization.cancelInvitation` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `organization.checkSlug` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `organization.create` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `organization.get` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `organization.initializeOnboarding` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `organization.invite` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `organization.list` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `organization.listInvitations` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `organization.update` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `organization.updateOnboarding` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `reference.add` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `reference.delete` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `reference.list` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `settings.deleteOrganization` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `settings.getMyRole` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `settings.listMembers` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `settings.removeMember` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `settings.updateMemberRole` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `settings.updateSettings` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
