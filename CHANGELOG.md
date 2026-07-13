# Changelog

All notable changes to AO3 Rich Comment Editor are documented here.

## [1.0.0] — 2026-06-27

Initial release.

### Features
- Rich/Plain toggle above every AO3 comment box, matching the author editor experience
- Toolbar: bold, italic, underline, strikethrough, headings (h2–h6), blockquote, ordered/unordered lists, links
- Sanitizes output through a first-party allowlist sanitizer before writing to the textarea — only AO3-allowed HTML tags, attributes, and http(s) URLs pass through
- Works on top-level comment forms and AJAX-loaded reply boxes
- Dark mode support (detects Reversi and system dark mode)

### Vendored libraries
- [Squire 2.3.2](https://github.com/fastmail/Squire) — vendored unminified with one documented 3-line patch removing its only dynamic `innerHTML` assignment (see `REVIEWER_NOTES.md`); the extension lints clean with zero `web-ext lint` warnings
