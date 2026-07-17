AO3 still hands commenters a plain textarea with zero preview, no rich text, and no way to check your formatting before you hit submit. Authors get a Rich/Plain toggle in the work editor. Commenters get nothing. This extension fixes that gap.

**What it does**

- Adds the same Rich/Plain toggle authors already have, now above every comment box
- Toolbar: bold, italic, underline, strikethrough, headings, blockquote, ordered/unordered lists, links, and a "Clear formatting" button
- Sanitizes everything to AO3's exact allowed HTML tags and attributes before it hits the textarea, so nothing gets silently stripped after you submit
- Works on top-level comments and reply boxes, including the ones that load in over AJAX
- Dark mode support (Reversi skin and system dark mode both detected)

**About the dev**

I'm [**NiniNeen**](https://github.com/ninineen): a senior frontend engineer w/ 10 years of experience building clean UIs by day, and an AO3 Author/VTuber moonlighting after hours. This extension is maintained solo, scratching my own itch as someone who reads (and writes) very long, over-formatted fic comments. Always over-engineering things for the aesthetic.

Nothing here is a black box, the source is [public](https://github.com/ninineen/AO3-Rich-Comment-Editor) and [REVIEWER_NOTES.md](https://github.com/ninineen/AO3-Rich-Comment-Editor/blob/main/REVIEWER_NOTES.md) documents exactly what's vendored, what's first-party, and how the sanitizer works.

**Credits**

Extension icon art by [thegingerbeck](https://archiveofourown.org/users/thegingerbeck) ([Tumblr](https://www.tumblr.com/tozerving)), used with permission.
