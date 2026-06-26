# AO3 Comment Editor

A browser extension that adds a WYSIWYG rich text editor to AO3 comment boxes — the same toggle between **Rich** and **Plain** modes that authors get in the work editor, but for commenters.

---

## Connect with me

**Support this project:** [Buy me a coffee on Ko-fi](https://ko-fi.com/ninineen)

I make AO3 skins, stream on Twitch, and post fandom content across socials. Find me here:

<p align="left">
  <a href="https://archiveofourown.org/users/ninineen/profile" target="_blank"><img src="https://img.shields.io/badge/AO3-990000?style=flat-square&logo=archiveofourown&logoColor=white" alt="AO3"></a>
  <a href="https://twitch.tv/ninineen" target="_blank"><img src="https://img.shields.io/badge/Twitch-9146FF?style=flat-square&logo=twitch&logoColor=white" alt="Twitch"></a>
  <a href="https://bsky.app/profile/ninineen.bsky.social" target="_blank"><img src="https://img.shields.io/badge/Bluesky-0285FF?style=flat-square&logo=bluesky&logoColor=white" alt="Bluesky"></a>
  <a href="https://ko-fi.com/ninineen" target="_blank"><img src="https://img.shields.io/badge/Ko--fi-F16061?style=flat-square&logo=kofi&logoColor=white" alt="Ko-fi"></a>
  <a href="https://discord.gg/ninineen" target="_blank"><img src="https://img.shields.io/badge/Discord-5865F2?style=flat-square&logo=discord&logoColor=white" alt="Discord"></a>
</p>

---

## What it does

- Injects a Quill editor above every comment textarea on AO3
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
4. Select the `ao3-comment-editor-extension/` folder
5. Navigate to any AO3 work page — the editor appears in the comment box

### Firefox
1. Go to `about:debugging#/runtime/this-firefox`
2. Click **Load Temporary Add-on**
3. Select `ao3-comment-editor-extension/manifest.json`
4. Note: temporary add-ons are removed when Firefox restarts; use [web-ext](https://extensionworkshop.com/documentation/develop/getting-started-with-web-ext/) for persistent dev installs

## File structure

```
ao3-comment-editor-extension/
├── manifest.json        # MV3 manifest (Chrome + Firefox compatible)
├── content/
│   ├── content.js       # Injection logic, Quill setup, sanitizer, toggle
│   └── content.css      # Toggle button styles, Quill overrides
├── vendor/
│   ├── quill.js         # Quill 2.0.3 (bundled locally, no CDN)
│   ├── quill.snow.css   # Quill Snow theme
│   └── purify.min.js    # DOMPurify 3.1.6
└── icons/
    └── icon-48.png
```

