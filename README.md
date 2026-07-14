# Journal Utils

Mobile Obsidian plugin for fast people, group, and location wikilinks while journaling. Built for the [mind-palace](https://github.com/sagersmith8/mind-palace) vault workflow.

## Features (in progress)

- Insert person / location links from the mobile editing toolbar
- Backlink-sorted pickers with ghost mention discovery
- Groups, migration, and avatar setup (see planning docs in mind-palace)

## Install on mobile (BRAT)

1. Install [BRAT](https://github.com/TfTHacker/obsidian42-brat) from Community Plugins.
2. **Add Beta plugin** → `sagersmith8/obsidian-journal-utils`
3. Enable **Journal Utils** under Community Plugins.

To disable: toggle off in Community Plugins (no git required).

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
