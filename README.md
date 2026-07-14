# Journal Utils

Mobile Obsidian plugin for fast people, group, and location wikilinks while journaling. Built for the [mind-palace](https://github.com/sagersmith8/mind-palace) vault workflow.

## Features (in progress)

- Insert person / location links from the mobile editing toolbar
- Backlink-sorted pickers with ghost mention discovery
- Groups, migration, and avatar setup (see planning docs in mind-palace)

## Install on mobile (BRAT)

BRAT (v1.1+) installs from **GitHub release assets**, not the repo tree alone. Each version needs a release with `manifest.json`, `main.js`, and `styles.css` attached (tag must match `manifest.json` version, e.g. `0.1.0`).

1. Install [BRAT](https://github.com/TfTHacker/obsidian42-brat) from Community Plugins.
2. **Add Beta plugin** → `sagersmith8/obsidian-journal-utils`
3. Enable **Journal Utils** under Community Plugins.

To disable: toggle off in Community Plugins (no git required).

### Releasing an update (maintainers)

```bash
npm run build
gh release create 0.1.0 main.js manifest.json styles.css --title "0.1.0" --notes "..."
```

Bump `version` in `manifest.json` to match the release tag before creating the release.

## Development

```bash
npm install
npm run dev    # watch build → main.js
npm run build  # production build
```

Test on desktop with mobile emulation (Obsidian dev console):

```js
app.emulateMobile(true)
```

Then reload the plugin.

## Mobile toolbar setup

After commands are added (Step 4+):

1. Settings → Mobile → Manage toolbar options
2. Remove undo/redo if desired
3. Add **Insert person link** and **Insert location link**

## License

MIT
