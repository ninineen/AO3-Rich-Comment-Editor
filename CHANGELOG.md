# Changelog

All notable changes to AO3 Rich Comment Editor are documented here.

## [Unreleased]

## [1.0.2] — 2026-07-13

### Other
- Resubmitted to AMO on the listed channel for public store distribution (1.0.1 was signed as unlisted by mistake and never appeared on the public listing); no functional changes

## [1.0.1] — 2026-07-13

### Features
- "Clear formatting" toolbar button to strip formatting from the current selection
- Mobile-friendly toolbar: smaller touch targets and tighter spacing below 600px viewports
- `npm run run:mobile` to load the extension in Firefox for Android during development

### Fixes
- Heading button (h1–h6) dividers now drawn via grid gap instead of per-button borders, fixing inconsistent border thickness on high-DPR phone screens
- Plain (HTML) textarea font size now matches the rich editor's visual size
- Fixed the rich editor being unclickable/untypable in AO3's draggable inbox reply popup: jQuery UI's `draggable()` was capturing every mousedown inside the contenteditable editor to start a drag instead of placing a cursor, since its default `cancel` selector excludes `<textarea>`/`<input>` but not contenteditable elements

## [1.0.0] — 2026-06-27

Initial release.

### Features
- Rich/Plain toggle above every AO3 comment box, matching the author editor experience
- Toolbar: bold, italic, underline, strikethrough, headings (h1–h6), blockquote, ordered/unordered lists, links
- Sanitizes output through a first-party allowlist sanitizer before writing to the textarea — only AO3-allowed HTML tags, attributes, and http(s) URLs pass through
- Works on top-level comment forms and AJAX-loaded reply boxes
- Dark mode support (detects Reversi and system dark mode)

### Vendored libraries
- [Squire 2.3.2](https://github.com/fastmail/Squire) — vendored unminified with one documented 3-line patch removing its only dynamic `innerHTML` assignment (see `REVIEWER_NOTES.md`); the extension lints clean with zero `web-ext lint` warnings
