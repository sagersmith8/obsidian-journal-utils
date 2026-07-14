# Journal Utils

Mobile Obsidian plugin for fast **people**, **group**, and **location** wikilinks while journaling. Built for the [mind-palace](https://github.com/sagersmith8/mind-palace) vault workflow.

> **Community listing:** This README is published on the [Journal Utils plugin page](https://community.obsidian.md/plugins/journal-utils). Edits here update what users see on [community.obsidian.md](https://community.obsidian.md) (the directory syncs from the repo).

## Features

- **Insert person link** — picker with people, groups, ghosts, create-new, and convert-to-group
- **Insert location link** — locations, shared ghosts, create-new
- **Mention tracking** — auto-maintains `people:` and `locations:` frontmatter lists on picker insert (deduped, append-only)
- **Group expansion** — inserting a group adds its `members:` to `people:` (not the group name)
- **Ghost mentions** — unresolved wikilinks surfaced for ignore, reclassify, or profile creation
- **Groups** — multi-member create flow with person-to-group conversion
- **People migration** — one-time command to move flat notes and merge sub-notes into `people/{Name}/{Name}.md`

Mobile-only: commands register on phone/tablet, not desktop.

## Install

### Community Plugins (recommended)

Journal Utils is listed in the [Obsidian Community directory](https://community.obsidian.md/plugins/journal-utils).

1. **Settings → Community plugins → Turn on community plugins** (disable Restricted Mode if prompted).
2. **Browse** and search for **Journal Utils**, or open the listing directly and click **Add to Obsidian**.
3. Enable the plugin under **Installed plugins**.

Updates: **Settings → Community plugins → Check for updates**.

**In-app search:** After a plugin passes review, Obsidian typically indexes it for Browse/search within **24 hours**. If it does not appear immediately, wait a day, then search again or use the [plugin page](https://community.obsidian.md/plugins/journal-utils) link. You can also install via URI: `obsidian://show-plugin?id=journal-utils`.

### BRAT (beta / pre-release)

Use [BRAT](https://github.com/TfTHacker/obsidian42-brat) to install from GitHub releases before they propagate, or to test unreleased builds:

1. Install BRAT from Community Plugins.
2. **Add Beta plugin** → `sagersmith8/obsidian-journal-utils`
3. Enable **Journal Utils** under Community Plugins.
4. Check for updates in BRAT when new versions ship.

BRAT pulls `manifest.json`, `main.js`, and `styles.css` from GitHub releases (tag must match `manifest.json` version).

Release assets include [GitHub artifact attestations](https://docs.github.com/en/actions/security-for-github-actions/using-artifact-attestations/using-artifact-attestations-to-establish-provenance-for-builds):

```bash
gh attestation verify main.js -R sagersmith8/obsidian-journal-utils
gh attestation verify styles.css -R sagersmith8/obsidian-journal-utils
```

### For plugin authors

New plugins are submitted at [community.obsidian.md](https://community.obsidian.md) (not the old `obsidian-releases` PR flow). See [CONTRIBUTING.md](CONTRIBUTING.md) for development and release details.

## Mobile toolbar setup

1. Open a note on your phone.
2. **Settings → Mobile → Manage toolbar options**
3. Remove undo/redo if you want the space.
4. Add:
   - **Insert person link** (user icon)
   - **Insert location link** (map-pin icon)

## Commands

| Command | Purpose |
|---------|---------|
| Insert person link | People, groups, ghosts, create person, convert to group |
| Insert location link | Locations, ghosts, create location |
| Migrate people folder to standard structure | Preview + run people/ consolidation |

## Mention tracking

When you insert a link via the picker commands, Journal Utils can append deduplicated wikilinks to frontmatter:

```yaml
people:
  - "[[Joy]]"
  - "[[Matt]]"
locations:
  - "[[Charleston]]"
```

| Behavior | Detail |
|----------|--------|
| Trigger | Picker insert only (not manual typing) |
| Scope | Any note where the command runs |
| Groups | Members expand into `people:`; body still gets `[[GroupName]]` |
| Ghost link-only | Body link only — no frontmatter |
| Ghost create | Creates profile and updates frontmatter |
| Removal | Append-only — deleting body links does not shrink lists |
| Toggle | Settings → **Update people/locations frontmatter on insert** (default on) |
| Feedback | Brief toast when list changes; error toast if note YAML is invalid |

Works with Obsidian Properties and Dataview (`FLATTEN people`, `contains(people, [[Joy]])`, etc.).

## Vault structure

```
people/{Name}/{Name}.md          # person
people/groups/{Name}/{Name}.md   # group (members: frontmatter)
locations/{Name}/{Name}.md       # location
```

Templates (created automatically if missing):

- `people/template.md`
- `people/groups/template.md`
- `locations/template.md`

Template variables: `{{title}}`, `{{slug}}`, `{{date}}`, `{{members}}` (groups only).

## Ghost mentions

Journal section headings (Gratitude, Goals, etc.) are blocklisted by default. Tap a ghost to ignore, create a profile, convert to group, or create a location.

## Migration

Run **Migrate people folder** once after committing your vault. Review the preview before confirming. Moves flat files like `people/Graham.md` → `people/Graham/Graham.md` and merges sub-notes into primary files.

## Data access

Journal Utils reads and writes notes only in your configured folders (`people`, `people/groups`, `locations`) plus vault-root legacy person notes. It does **not** enumerate your entire vault.

| Access | Purpose |
|--------|---------|
| Entity folders | List people, groups, and locations for pickers |
| Vault root `.md` files | Resolve legacy flat person notes (e.g. `Joy.md`) |
| Active note | Insert wikilinks and update `people:` / `locations:` frontmatter |
| `metadataCache.unresolvedLinks` | Surface ghost mentions (no full-vault scan) |
| Migration command | Scan only the people folder for notes to consolidate |

All file access stays on your device; nothing is sent to external servers.

## Development

See [CONTRIBUTING.md](CONTRIBUTING.md) for setup, conventions, and how to open a PR.

```bash
npm install
npm run dev    # watch build
npm run build  # production build
npm test       # vitest
```

Desktop mobile emulation (dev console): `app.emulateMobile(true)` then reload the plugin.

CI runs on every push/PR to `main` (test + build). Releases are tag-driven — details in [CONTRIBUTING.md](CONTRIBUTING.md#releases-maintainers).

## License

MIT
