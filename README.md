# AO3 Rich Comment Editor

A browser extension that adds a WYSIWYG rich text editor to AO3 comment boxes — the same toggle between **Rich** and **Plain** modes that authors get in the work editor, but for commenters.

---

## Connect with me

**Support this project:** [Buy me a coffee on Ko-fi](https://ko-fi.com/ninineen)

I make AO3 skins and tools, write fanfic, stream on Twitch, and post fandom content across socials. Find me here:

<p align="left">
  <a href="https://archiveofourown.org/users/ninineen/profile" target="_blank"><img src="https://img.shields.io/badge/AO3-990000?style=flat-square&logo=archiveofourown&logoColor=white" alt="AO3"></a>
  <a href="https://twitch.tv/ninineen" target="_blank"><img src="https://img.shields.io/badge/Twitch-9146FF?style=flat-square&logo=twitch&logoColor=white" alt="Twitch"></a>
  <a href="https://bsky.app/profile/ninineen.bsky.social" target="_blank"><img src="https://img.shields.io/badge/Bluesky-0285FF?style=flat-square&logo=bluesky&logoColor=white" alt="Bluesky"></a>
  <a href="https://ko-fi.com/ninineen" target="_blank"><img src="https://img.shields.io/badge/Ko--fi-F16061?style=flat-square&logo=kofi&logoColor=white" alt="Ko-fi"></a>
  <a href="https://discord.gg/ninineen" target="_blank"><img src="https://img.shields.io/badge/Discord-5865F2?style=flat-square&logo=discord&logoColor=white" alt="Discord"></a>
</p>

---

## What it does

- Injects a Squire-based rich text editor above every comment textarea on AO3
- **Rich mode** — format your comment with bold, italic, headers, lists, links, etc.
- **Plain mode** — reveals the raw HTML textarea for hand-editing
- Sanitizes output to AO3's allowed HTML tags and attributes before submitting
- Works on top-level comment forms and reply boxes (including ones loaded via AJAX)

## Allowed HTML

Matches AO3's own allowed tags: `<b>`, `<i>`, `<u>`, `<em>`, `<strong>`, `<a>`, `<blockquote>`, `<ul>`, `<ol>`, `<li>`, `<h1>`–`<h6>`, `<span>`, `<div>`, `<p>`, `<br>`, `<img>`, `<table>`, and more. Anything AO3 would strip is sanitized out before it reaches the textarea.

## Installation (unpacked / developer mode)

### Chrome / Edge
1. Go to `chrome://extensions`
2. Enable **Developer mode** (toggle, top right)
3. Click **Load unpacked**
4. Select the `AO3-Rich-Comment-Editor/` folder
5. Navigate to any AO3 work page — the editor appears in the comment box

### Firefox
1. Go to `about:debugging#/runtime/this-firefox`
2. Click **Load Temporary Add-on**
3. Select `AO3-Rich-Comment-Editor/manifest.json`
4. Note: temporary add-ons are removed when Firefox restarts; use [web-ext](https://extensionworkshop.com/documentation/develop/getting-started-with-web-ext/) for persistent dev installs

## Development

### Setup

```bash
npm start
```

This installs dependencies, copies vendored libraries into `vendor/`, lints, and builds in one step.

### Scripts

| Command | What it does |
|---|---|
| `npm start` | Install → vendor → lint → build (full setup in one step) |
| `npm run vendor` | Copy pinned library files from `node_modules/` into `vendor/` |
| `npm run lint` | Validate the extension with web-ext |
| `npm run build` | Package into a submission-ready ZIP in `web-ext-artifacts/` |
| `npm run run:firefox` | Load the extension in Firefox for live testing |

### Reloading after changes

- **Chrome:** go to `chrome://extensions` → click the refresh icon on the extension card, then hard-reload the AO3 tab
- **Firefox:** `npm run run:firefox` auto-reloads on file changes, or go to `about:debugging` → click **Reload**

### Key files

- [`content/content.js`](content/content.js) — all injection logic: Squire setup, toolbar, Rich/Plain toggle, first-party sanitizer, AJAX reply box detection
- [`content/content.css`](content/content.css) — toggle button, toolbar, and editor styles scoped to AO3

### Vendored libraries

No bundler — libraries are committed to `vendor/` so extension reviewers can read them directly. Versions are pinned in `package.json` and the files are generated via `npm run vendor`.

- [Squire 2.3.2](https://github.com/fastmail/Squire) (`squire.js`) — vendored unminified, with one documented 3-line patch (`vendor/squire-no-innerhtml.patch`) that removes its only dynamic `innerHTML` assignment; see `REVIEWER_NOTES.md`

Sanitization is first-party: a small allowlist tree-walker in `content/content.js` restricts output to AO3-allowed tags/attributes and http(s) URLs.

To upgrade a library: update its version in `package.json`, run `npm install`, then `npm run vendor`, and commit the updated `vendor/` files.

### Testing manually

Load an AO3 work page, leave a comment, click **Reply** on an existing comment to confirm AJAX reply boxes also pick up the editor.

---

## File structure

```
AO3-Rich-Comment-Editor/
├── manifest.json           # MV3 manifest (Chrome + Firefox compatible)
├── package.json            # Dev tooling (web-ext)
├── .web-ext-config.mjs     # web-ext ignore rules (excludes node_modules, .git, etc.)
├── content/
│   ├── content.js          # Injection logic, Squire setup, sanitizer, toggle
│   └── content.css         # Toggle, toolbar, and editor styles
├── vendor/
│   ├── squire.js           # Squire 2.3.2 (bundled locally, no CDN; patched, see below)
│   └── squire-no-innerhtml.patch  # 3-line patch applied by npm run vendor
└── icons/
    └── icon-48.png         # Art by @sunsetfoam (Abstraum / Traum)
```

## Credits

- Extension icon art by [@sunsetfoam](https://www.instagram.com/sunsetfoam) — reposted with credit as per their terms. Do not reuse for commercial or political purposes.

---

<sub><sup><i>Un jour je serai de retour près de toi</i></sup></sub>

