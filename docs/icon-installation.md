# Hugeicons installation

Application, UI, and landing source imports use Hugeicons Pro. Each manifest declares the bulk-rounded, duotone-rounded, and solid-rounded packs at `^4.0.0`. Original style choices are retained; filled status icons use solid, navigation uses bulk, and supporting controls use duotone.

`pnpm install` selects the pack through `.pnpmfile.cjs`:

- With `HUGEICONS_TOKEN` exported in the install environment, install the real Pro packages from `npm.hugeicons.com`.
- Without a token, install the free public pack under those same module names. Community users need no registry account. The free pack has a single style, so it cannot reproduce Pro bulk/solid styling.

Set the token using your shell or CI secret manager, then run `pnpm install --no-frozen-lockfile` when switching editions. The override map is recorded in the lockfile: a frozen install fails if the selected edition differs, rather than silently installing free icons when Pro was requested. Commit the appropriate lockfile for a deployment that requires frozen Pro installs. Never commit the token. An invalid configured token fails the install; it does not fall back to community icons.

The checked-in lockfile uses the community edition so public CI and new contributors can run `pnpm install --frozen-lockfile`. Vercel projects use `scripts/install-vercel.mjs` through their app-level `vercel.json`. Without a token this enforces the committed frozen community lockfile. With a token it explicitly permits lockfile resolution in the disposable deployment checkout so the Pro overrides can replace the community aliases. The repository lockfile is not changed by that deployment. Other Pro build environments must likewise resolve the licensed edition or supply its matching lockfile. A build must use the same installed edition as its verification run.

The SDK-only release workflow deliberately does not pass the Pro token to installation: SDK bundles do not use icon packs, and their frozen install uses the committed community lockfile. This does not change token-based Pro selection for application builds or local installs.

Sources: [Hugeicons Pro setup](https://hugeicons.com/docs/integrations/react/pro), [pnpm install hooks](https://pnpm.io/pnpmfile).
