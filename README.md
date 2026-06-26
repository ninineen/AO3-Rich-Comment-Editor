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

- Injects a Trix editor above every comment textarea on AO3
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

No build step — this is a plain JS extension. Edit files directly and reload.

**Reload after changes:**
- Chrome: go to `chrome://extensions` → click the refresh icon on the extension card, then hard-reload the AO3 tab
- Firefox: go to `about:debugging` → click **Reload**

**Key files:**
- [`content/content.js`](content/content.js) — all injection logic: Trix setup, Rich/Plain toggle, sanitizer, AJAX reply box detection
- [`content/content.css`](content/content.css) — toggle button styles and Trix overrides scoped to AO3

**Vendored libraries** (no npm, no bundler):
- [Trix 2.1.19](https://trix-editor.org/) — drop the new `trix.js` + `trix.css` into `vendor/` to upgrade
- [DOMPurify 3.1.6](https://github.com/cure53/DOMPurify) — replace `vendor/purify.min.js` to upgrade

**Testing manually:** load an AO3 work page, leave a comment, click **Reply** on an existing comment to confirm AJAX reply boxes also pick up the editor.

---

## File structure

```
AO3-Rich-Comment-Editor/
├── manifest.json        # MV3 manifest (Chrome + Firefox compatible)
├── content/
│   ├── content.js       # Injection logic, Trix setup, sanitizer, toggle
│   └── content.css      # Toggle button styles, Trix overrides
├── vendor/
│   ├── trix.js          # Trix 2.1.19 (bundled locally, no CDN)
│   ├── trix.css         # Trix default styles
│   └── purify.min.js    # DOMPurify 3.1.6
└── icons/
    └── icon-48.png      # Art by @sunsetfoam (Abstraum / Traum)
```

## Credits

- Extension icon art by [@sunsetfoam](https://www.instagram.com/sunsetfoam) — reposted with credit as per their terms. Do not reuse for commercial or political purposes.

---

<sub><sup><i>Un jour je serai de retour près de toi</i></sup></sub>

