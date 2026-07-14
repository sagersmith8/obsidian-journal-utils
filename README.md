# Journal Utils

Mobile Obsidian plugin for fast **people**, **group**, and **location** wikilinks while journaling. Built for the [mind-palace](https://github.com/sagersmith8/mind-palace) vault workflow.

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

### Option A: BRAT (recommended today)

BRAT installs from **GitHub release assets**. Each release attaches `manifest.json`, `main.js`, and `styles.css` (tag must match `manifest.json` version).

1. Install [BRAT](https://github.com/TfTHacker/obsidian42-brat) from Community Plugins.
2. **Add Beta plugin** → `sagersmith8/obsidian-journal-utils`
3. Enable **Journal Utils** under Community Plugins.
4. Check for updates in BRAT when new versions ship.

### Option B: Obsidian Community Plugins (public listing)

To appear in the official catalog (no BRAT required), a maintainer submits a PR to [obsidianmd/obsidian-releases](https://github.com/obsidianmd/obsidian-releases) adding this repo to `community-plugins.json`. Requirements:

- Public GitHub repo with MIT license
- `manifest.json`, `versions.json`, and GitHub releases with `main.js` + `styles.css` assets
- Plugin follows [Obsidian developer policies](https://docs.obsidian.md/Developer+policies)

Until that PR is merged, use BRAT (Option A).

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
# 1. Bump version in manifest.json AND package.json first
# 2. Update versions.json with the new version → minAppVersion mapping
npm test
npm run build
git add manifest.json package.json versions.json main.js
git commit -m "Release X.Y.Z"
git push
gh release create X.Y.Z main.js manifest.json styles.css --title "X.Y.Z" --notes "..."
```

Release tag must match `manifest.json` version or BRAT will warn.

## License

MIT
