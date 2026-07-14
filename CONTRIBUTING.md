# Contributing to Journal Utils

Thank you for helping improve Journal Utils. Issues, bug reports, and pull requests are welcome.

## Before you start

- Read the [README](README.md) for feature scope and vault conventions.
- The README on GitHub is also rendered on the [community plugin page](https://community.obsidian.md/plugins/journal-utils). Keep user-facing docs accurate there — that page is what most installers read.
- This plugin targets **mobile** Obsidian. Test picker flows on a phone or with `app.emulateMobile(true)` in the desktop dev console.

## Development setup

```bash
git clone https://github.com/sagersmith8/obsidian-journal-utils.git
cd obsidian-journal-utils
npm install
```

Link or copy the repo into a vault for local testing:

```
your-vault/.obsidian/plugins/journal-utils/
  manifest.json
  main.js
  styles.css
```

Then run a watch build:

```bash
npm run dev
```

Reload the plugin in Obsidian after each rebuild (**Settings → Community plugins → Journal Utils → reload**).

## Project layout

| Path | Purpose |
|------|---------|
| `src/main.ts` | Plugin entry, commands, service wiring |
| `src/modals/` | Picker and migration UI |
| `src/services/` | Entity, ghost, mention, migration, template logic |
| `src/utils/` | Pure helpers (paths, frontmatter, vault I/O) |
| `tests/` | Vitest unit tests for pure logic and services |
| `.github/workflows/` | CI (test + build) and release automation |

Prefer **pure functions + unit tests** for business logic. Keep Obsidian API calls in services and modals.

## Running checks

```bash
npm test        # vitest — required before opening a PR
npm run build   # typecheck + production bundle
```

CI runs the same test and build steps on every push/PR to `main`.

## Code guidelines

Match existing style in the file you edit:

- TypeScript, tabs for indentation, minimal scope per change.
- **Settings UI:** use `getSettingDefinitions()` / `Setting.setHeading()` — not raw `<h2>` elements.
- **Modal titles:** `new Setting(contentEl).setName(...).setHeading()`.
- **Popout windows:** `window.requestAnimationFrame()`, not bare `requestAnimationFrame()`.
- **File deletion:** `fileManager.trashFile()`, not `vault.trash()`.
- **Vault reads:** scope to configured entity folders (`people`, `people/groups`, `locations`) — avoid `vault.getMarkdownFiles()` / full-vault enumeration.
- Add or update tests when changing pure logic in `src/services/*.ts` or `src/utils/`.

## Pull requests

1. Fork and branch from `main` (`fix/…`, `feat/…`, or `docs/…`).
2. Keep PRs focused — one concern per PR when possible.
3. Ensure `npm test` and `npm run build` pass.
4. Describe what changed and how you tested it (device/emulation steps for UI).

No need to bump `manifest.json` for doc-only changes. Feature and bugfix PRs should not include version bumps unless a maintainer is cutting a release in the same change.

## Reporting bugs

Include:

- Obsidian version and platform (iOS/Android/desktop emulation)
- Journal Utils version
- Steps to reproduce
- Expected vs actual behavior
- Relevant vault structure (e.g. flat `people/Name.md` vs nested)

## Releases (maintainers)

Releases are automated when a semver tag matching `manifest.json` is pushed:

```bash
# 1. Bump version in manifest.json, package.json, and versions.json
npm test && npm run build
git add manifest.json package.json versions.json main.js
git commit -m "Bump version to X.Y.Z"
git push

# 2. Tag and push
git tag X.Y.Z
git push origin X.Y.Z
```

The [Release workflow](.github/workflows/release.yml) verifies the tag, runs tests, builds, generates artifact attestations for `main.js` and `styles.css`, and publishes GitHub release assets.

After a release, the community directory picks up the new version from GitHub; users update via **Settings → Community plugins → Check for updates**.

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
