# Notes to Reviewer

## Lint status

`web-ext lint` reports **0 errors, 0 warnings, 0 notices**.

## Third-party code

The only vendored library is [Squire 2.3.2](https://github.com/fastmail/Squire) (MIT, by Fastmail), included as the **unminified** `dist/squire-raw.js` build so it can be read directly.

One 3-line modification is applied to the upstream file, tracked in `vendor/squire-no-innerhtml.patch` and applied reproducibly by `npm run vendor`:

```diff
     _setRawHTML(html) {
       const root = this._root;
-      root.innerHTML = html;
+      const parsed = new DOMParser().parseFromString(html, "text/html");
+      root.replaceChildren(...parsed.body.childNodes);
```

**Why:** this was Squire's only dynamic `innerHTML` assignment, and replacing it with `DOMParser` removes the last `UNSAFE_VAR_ASSIGNMENT` lint warning. Behavior is identical — `_setRawHTML` only ever receives Squire's own serializer output (undo/redo state and `setHTML`, whose input has already passed through the sanitizer described below).

To verify the vendored file against upstream:

```
npm install
cp node_modules/squire-rte/dist/squire-raw.js /tmp/upstream.js
diff /tmp/upstream.js vendor/squire.js   # shows only the 3-line patch above
```

## Sanitization

All HTML is sanitized by a first-party allowlist tree-walker in `content/content.js` (`cleanNode` / `sanitizeToFragment` / `sanitizeToString`):

- elements not in AO3's allowed tag list are unwrapped (children kept) or, for `script`/`style`/etc., removed with their content
- attributes not in AO3's allowed attribute list are stripped
- `href`/`src` must resolve to `http:` or `https:` URLs; anything else (including `javascript:`) is dropped
- comments, CDATA, and processing instructions are removed

It is wired into Squire's `sanitizeToDOMFragment` config hook, so **all** HTML entering the editor (initial load, Rich/Plain toggle, and paste) passes through it, and it runs again on every edit before the result is written to the AO3 comment textarea (`textarea.value` — not a DOM sink). No first-party code assigns to `innerHTML`.

## Testing

No account is required to test basic functionality. To test:

1. Go to https://archiveofourown.org/works/ and click any fanfic
2. Scroll to the bottom of the page — the WYSIWYG editor should appear in the comment box
