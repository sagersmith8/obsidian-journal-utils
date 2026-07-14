# Journal Utils

Mobile Obsidian plugin for fast **people**, **group**, and **location** wikilinks while journaling. Built for the [mind-palace](https://github.com/sagersmith8/mind-palace) vault workflow.

## Features

- **Insert person link** — picker with people, groups, ghosts, create-new, and convert-to-group
- **Insert location link** — locations, shared ghosts, create-new
- **Ghost mentions** — unresolved wikilinks surfaced for ignore, reclassify, or profile creation
- **Groups** — multi-member create flow with person-to-group conversion
- **People migration** — one-time command to move flat notes and merge sub-notes into `people/{Name}/{Name}.md`

Mobile-only: commands register on phone/tablet, not desktop.

## Install on mobile (BRAT)

BRAT (v1.1+) installs from **GitHub release assets**. Each release must attach `manifest.json`, `main.js`, and `styles.css` (tag matches `manifest.json` version).

1. Install [BRAT](https://github.com/TfTHacker/obsidian42-brat) from Community Plugins.
2. **Add Beta plugin** → `sagersmith8/obsidian-journal-utils`
3. Enable **Journal Utils** under Community Plugins.
4. Check for updates in BRAT when new versions ship.

To disable: toggle off in Community Plugins.

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

## Development

```bash
npm install
npm run dev    # watch build
npm run build  # production build
npm test       # vitest
```

Desktop mobile emulation (dev console): `app.emulateMobile(true)` then reload the plugin.

### Releasing (maintainers)

```bash
npm run build
gh release create 1.0.0 main.js manifest.json styles.css --title "1.0.0" --notes "..."
```

Bump `version` in `manifest.json` to match the release tag.

## License

MIT
