# Releasing Popular

Maintainer documentation. Versions are tagged in **lockstep** across
[hugo-theme-popular](https://github.com/Mariatta/hugo-theme-popular) and
[astro-theme-popular](https://github.com/Mariatta/astro-theme-popular); this
file ships identically in both (PARITY.md Tier 1).

## The release ritual

1. **Write the changelog in a PR.** Move the `## [Unreleased]` entries under
   a new `## [X.Y.Z] - date` heading (blank line after every heading). On
   the Astro side, bump `"version"` in **both** `package.json` and
   `package/package.json`. Use the same branch name in both repos so the
   parity CI pairs them; cut both branches from freshly pulled mains.
2. **Merge the pair together.**
3. **Dispatch the release in both repos:**

   ```bash
   gh workflow run release.yml -R Mariatta/hugo-theme-popular -f version=X.Y.Z
   gh workflow run release.yml -R Mariatta/astro-theme-popular -f version=X.Y.Z
   ```

The workflow validates (semver input, changelog section present, tag free,
cross-repo parity, and on Astro the version fields), then tags `vX.Y.Z`,
publishes the GitHub Release with the changelog section as notes, and (Astro)
publishes `astro-theme-popular` to the npm registry.

Merging a PR does **not** release anything; the dispatch is the deliberate
act. Nothing releases with the repos out of parity.

## npm credentials

Two different credentials for two different jobs; don't mix them up.

### CI (the release workflow): trusted publishing, no token

The workflow authenticates to npm with its OIDC identity (like PyPI's
trusted publishers): nothing expires, nothing is stored, and provenance
attestations are generated automatically. One-time setup on npmjs.com,
package page → **Settings** → **Trusted Publisher**:

- Publisher: **GitHub Actions**
- Organization or user: `Mariatta`
- Repository: `astro-theme-popular`
- Workflow filename: `release.yml`
- Environment: leave blank

The workflow side is already wired: `permissions: id-token: write` and
Node 24 (trusted publishing needs npm >= 11.5.1). Any old `NPM_TOKEN`
secret and granular tokens can be deleted
(`gh secret delete NPM_TOKEN -R Mariatta/astro-theme-popular`).

### Local (one-off publishes): your own login

`npm login` once per machine (browser flow); `npm publish` from `package/`
then prompts for your authenticator OTP interactively. This is the fallback
when a release's npm step failed after tagging: the workflow cannot be
re-dispatched for an existing tag, so publish that version manually:

```bash
git pull && cd package && npm publish
```

The registry version must always equal the latest git tag; the workflow's
validate step enforces the version fields so the two cannot drift for
future releases.

## Troubleshooting

- **Auth errors in the workflow's npm step** (`EOTP`, 401/404 on PUT):
  the Trusted Publisher is missing or misconfigured on npmjs.com (the repo
  and workflow filename must match exactly); see above. Fix it, publish the
  stranded version manually, and the next release is hands-off.
- **Local `npm whoami` says E401 / publish 404s on PUT**: your login
  session was revoked (npm expires sessions aggressively now); `npm login`
  again and retry.
- **"tag vX.Y.Z already exists"**: that version is released; the workflow
  refuses reruns by design. If npm is behind, use the local publish.
- **Parity refusal**: the two repos' shared files differ; sync them
  (`bash scripts/sync-shared.sh --check` shows the drift) and re-dispatch.
- **A paired PR's parity check fails right after pushing**: the twin branch
  probably didn't exist yet when the check ran; re-run the failed job once
  both branches are pushed.
