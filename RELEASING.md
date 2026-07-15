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

### CI (the release workflow): a granular access token

The workflow publishes with the `NPM_TOKEN` repository secret. Requirements:

- On npmjs.com: avatar → **Access Tokens** → **Generate New Token** →
  **Granular Access Token**. Packages and scopes: **Read and write**,
  limited to **only** `astro-theme-popular`. Set an expiration and put its
  renewal on your calendar: when the token expires the publish step starts
  failing (or skipping, if the secret is removed), never silently.
- On the package page → **Settings** → **Publishing access**: must be
  "Require two-factor authentication **or** an automation or granular access
  token". The strictest setting ("…and disallow tokens") makes CI publishing
  impossible by policy, and a classic "Publish" token is subject to OTP:
  both produce `EOTP` ("This operation requires a one-time password") in the
  workflow log.
- Store it: `gh secret set NPM_TOKEN -R Mariatta/astro-theme-popular`
  (prompts for the value; never paste tokens into files or shell history).

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

- **`EOTP` in the workflow**: wrong token type or package publishing-access
  setting; see above. Fix on npmjs.com, publish the stranded version
  manually, and the next release is hands-off.
- **"tag vX.Y.Z already exists"**: that version is released; the workflow
  refuses reruns by design. If npm is behind, use the local publish.
- **Parity refusal**: the two repos' shared files differ; sync them
  (`bash scripts/sync-shared.sh --check` shows the drift) and re-dispatch.
- **A paired PR's parity check fails right after pushing**: the twin branch
  probably didn't exist yet when the check ran; re-run the failed job once
  both branches are pushed.
