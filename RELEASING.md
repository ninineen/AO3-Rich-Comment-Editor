# Releasing a new version

`npm run release` lints, builds, and signs the extension for the **listed** AMO channel: it submits for public store distribution on addons.mozilla.org, subject to Mozilla review (automated, and sometimes manual for first-time or higher-risk changes). Once approved, the extension is installable straight from the AMO listing page, not just via a manually-downloaded `.xpi`.

## One-time setup

Create a `.env` file in the project root (already git-ignored) with your [AMO API credentials](https://addons.mozilla.org/developers/addon/api/key/):
```
WEB_EXT_API_KEY=user:XXXXXXX
WEB_EXT_API_SECRET=YOUR_JWT_SECRET
```

`web-ext` picks these up automatically via its `WEB_EXT_*` environment variable prefix — no need to pass `--api-key`/`--api-secret` explicitly.

## Every release

1. Make sure `CHANGELOG.md` has an `[Unreleased]` section describing what changed. If it doesn't, add one before you forget what you did.
2. Decide the new version number (semver: patch for fixes, minor for new features, major for breaking changes).
3. Bump the version in **both** `manifest.json` and `package.json`. They should always match, and AMO rejects a signing request that reuses a version number that's already been submitted — even if that version was later deleted.
4. Rename `CHANGELOG.md`'s `[Unreleased]` header to `[<new version>] <today's date>` (match the existing entries' format), and add a fresh empty `[Unreleased]` section above it for next time.
5. Update `amo-metadata.json`'s `version.release_notes` (public-facing, should mirror the new `CHANGELOG.md` entry) and `version.approval_notes` (private, for reviewers — update this if there's something new they specifically need to test; otherwise the general testing steps still apply).
6. Commit the version bump + changelog + metadata update (e.g. `chore(release): bump to 1.0.3`), then **push to the remote**. Always commit and push before signing/submitting — the release should reflect what's actually on GitHub, not just what's on disk locally.
7. Run:
   ```bash
   npm run release
   ```
8. Once signing succeeds, the signed `.xpi` lands in `web-ext-artifacts/`. If it's still pending human review on AMO, the version won't be publicly installable until that clears — check **Manage Status & Versions** on the [AMO Developer Hub](https://addons.mozilla.org/developers/addon/ao3-rich-comment-editor/versions) for status.
9. Tag the release commit: `git tag v<new version>` then `git push origin v<new version>` (or push all tags with `git push --tags`).
10. Go to [GitHub Releases](https://github.com/ninineen/AO3-Rich-Comment-Editor/releases) → **Draft a new release** → pick the tag you just pushed → paste in the relevant `CHANGELOG.md` entry as the release notes → attach the `.xpi` from `web-ext-artifacts/` → **Publish release**.

## `amo-metadata.json`

This file supplies the metadata AMO requires for listed submissions (`categories` and `summary` are mandatory on first submission; `license`, `release_notes`, `approval_notes`, `contributions_url`, and `homepage` are also set here). It's excluded from the packaged `.xpi` via `.web-ext-config.mjs`. See the [AMO add-on API create/version-create docs](https://mozilla.github.io/addons-server/topics/api/addons.html) for the full field reference if you need to add more (e.g. `support_email`, `compatibility`).

## Troubleshooting

- **`"license"` field required for listed versions:** the add-on wasn't originally created through the AMO web submission form (which forces a license pick), so it has none set at the API level. Fixed by setting `version.license` in `amo-metadata.json` — see the file for the current value.
- **Manifest V3 checklist:** if AMO or `web-ext lint` flags something manifest-related, check it against the [Manifest V3 migration guide](https://extensionworkshop.com/documentation/develop/manifest-v3-migration-guide/) checklist before assuming it's a real bug — most common gotchas (host permissions, `browser_specific_settings.gecko.id`, action rename, CSP key) are already handled here.
