# 🧩 AO3 Rich Comment Editor

A browser extension that adds a WYSIWYG rich text editor to AO3 comment boxes: the same toggle between **Rich** and **Plain** modes that authors get in the work editor, now for commenters too.

---

## 💌 Connect with me

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

## ✨ What it does

- Injects a Squire-based rich text editor above every comment textarea on AO3
- **Rich mode:** format your comment with bold, italic, headers, lists, links, and more
- **Plain mode:** reveals the raw HTML textarea for hand-editing
- Sanitizes output to AO3's allowed HTML tags and attributes before submitting, so nothing gets silently stripped after the fact
- Works on top-level comment forms and reply boxes, including ones loaded via AJAX

## 🧰 Tech Stack & Tools

<p align="left">
  <img src="https://img.shields.io/badge/JavaScript-f7e1a0?style=flat-square&logo=javascript&logoColor=8a6d00" alt="JavaScript">
  <img src="https://img.shields.io/badge/CSS3-663399?style=flat-square&logo=css3&logoColor=white" alt="CSS3">
  <img src="https://img.shields.io/badge/WebExtension-ffccd5?style=flat-square&logo=firefoxbrowser&logoColor=cc5a71" alt="WebExtension">
  <img src="https://img.shields.io/badge/Squire-2c3e50?style=flat-square&logoColor=white" alt="Squire">
  <img src="https://img.shields.io/badge/Jest-C21325?style=flat-square&logo=jest&logoColor=white" alt="Jest">
</p>

## 📋 Allowed HTML

Matches AO3's own allowed tags: `<b>`, `<i>`, `<u>`, `<em>`, `<strong>`, `<a>`, `<blockquote>`, `<ul>`, `<ol>`, `<li>`, `<h1>`–`<h6>`, `<span>`, `<div>`, `<p>`, `<br>`, `<img>`, `<table>`, and more. Anything AO3 would strip is sanitized out before it ever reaches the textarea.

---

## 📥 Installation (unpacked / developer mode)

### Chrome / Edge
1. Go to `chrome://extensions`
2. Enable **Developer mode** (toggle, top right)
3. Click **Load unpacked**
4. Select the `AO3-Rich-Comment-Editor/` folder
5. Navigate to any AO3 work page: the editor appears in the comment box

### Firefox
1. Go to `about:debugging#/runtime/this-firefox`
2. Click **Load Temporary Add-on**
3. Select `AO3-Rich-Comment-Editor/manifest.json`
4. Note: temporary add-ons are removed when Firefox restarts. Use [web-ext](https://extensionworkshop.com/documentation/develop/getting-started-with-web-ext/) for persistent dev installs

---

## 🛠️ Development

### Setup

```bash
npm start
```

This installs dependencies, copies vendored libraries into `vendor/`, lints, and builds, all in one step.

### Scripts

| Command | What it does |
|---|---|
| `npm start` | Install → vendor → lint → build (full setup in one step) |
| `npm run vendor` | Copy pinned library files from `node_modules/` into `vendor/` |
| `npm run lint` | Validate the extension with web-ext |
| `npm run build` | Package into a submission-ready ZIP in `web-ext-artifacts/` |
| `npm run run:firefox` | Load the extension in Firefox for live testing |

### Reloading after changes

- **Chrome:** go to `chrome://extensions`, click the refresh icon on the extension card, then hard-reload the AO3 tab
- **Firefox:** `npm run run:firefox` auto-reloads on file changes, or go to `about:debugging` and click **Reload**

### Key files

- [`content/content.js`](content/content.js): injection logic, Squire setup, toolbar, Rich/Plain toggle, AJAX reply box detection
- [`content/sanitizer.js`](content/sanitizer.js): first-party allowlist sanitizer (loaded before `content.js`)
- [`content/content.css`](content/content.css): toggle button, toolbar, and editor styles scoped to AO3
- [`tests/`](tests/): Jest unit tests (jsdom) for the content script and sanitizer

### Vendored libraries

No bundler here: libraries are committed to `vendor/` so extension reviewers can read them directly. Versions are pinned in `package.json`, and the files are generated via `npm run vendor`.

- [Squire 2.3.2](https://github.com/fastmail/Squire) (`squire.js`): vendored unminified, with one documented 3-line patch (`vendor/squire-no-innerhtml.patch`) that removes its only dynamic `innerHTML` assignment. See `REVIEWER_NOTES.md` for details.

Sanitization is first-party: a small allowlist tree-walker in `content/sanitizer.js` restricts output to AO3-allowed tags, attributes, and http(s) URLs.

To upgrade a library: bump its version in `package.json`, run `npm install`, then `npm run vendor`, and commit the updated `vendor/` files.

### Testing manually

Load an AO3 work page, leave a comment, and click **Reply** on an existing comment to confirm AJAX reply boxes pick up the editor too.

---

## 📦 File structure

```
AO3-Rich-Comment-Editor/
├── manifest.json           # MV3 manifest (Chrome + Firefox compatible)
├── package.json            # Dev tooling (web-ext, jest)
├── .web-ext-config.mjs     # web-ext ignore rules (keeps dev files out of the XPI)
├── jest.config.js          # Jest (jsdom) test config
├── content/
│   ├── content.js          # Injection logic, Squire setup, toolbar, Rich/Plain toggle
│   ├── sanitizer.js        # First-party allowlist sanitizer (loaded before content.js)
│   └── content.css         # Toggle, toolbar, and editor styles
├── vendor/
│   ├── squire.js           # Squire 2.3.2 (bundled locally, no CDN, patched, see below)
│   └── squire-no-innerhtml.patch  # 3-line patch applied by npm run vendor
├── tests/
│   ├── content.test.js     # Unit tests for the content script
│   ├── sanitizer.test.js   # Unit tests for the sanitizer
│   └── fixtures/           # Test-only HTML fixtures
└── icons/
    └── icon-48.png         # Art by @sunsetfoam (Abstraum / Traum)
```

## 🎨 Credits

- Extension icon art by [@sunsetfoam](https://www.instagram.com/sunsetfoam), reposted with credit as per their terms. Do not reuse for commercial or political purposes.

---

<sub>💖 Made so commenters can leave just as unhinged and over-formatted a comment as the fic deserves.</sub>

<sub><sup><i>Un jour je serai de retour près de toi</i></sup></sub>
