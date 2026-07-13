/* AO3 Comment Editor — content script.
   Sanitizer functions (sanitizeToFragment, sanitizeToString) come from
   content/sanitizer.js, loaded before this file per manifest.json. */

// ─────────────────────────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────────────────────────

// The one piece of AO3 page coupling: every comment box (top-level, reply,
// edit) is a textarea whose id starts with this prefix.
const COMMENT_TEXTAREA_SELECTOR = "textarea[id^='comment_content_for']";

// Class names — keep in sync with content/content.css.
const CLS = {
  wrapper: "ao3ce-wrapper",
  dark: "ao3ce-dark",
  toggleBar: "ao3ce-toggle",
  viewBtn: "ao3ce-btn",
  viewBtnActive: "ao3ce-btn--active",
  toolbar: "ao3ce-toolbar",
  editor: "ao3ce-editor",
  tool: "ao3ce-tool",
  toolMono: "ao3ce-tool--mono",
  toolActive: "ao3ce-tool--active",
  headingsGroup: "ao3ce-headings-group",
  headingBtn: "ao3ce-heading-btn",
  imageBtn: "ao3ce-image-btn",
  urlRow: "ao3ce-image-row",
  urlHint: "ao3ce-image-hint",
  plainTextarea: "ao3ce-plain-textarea",
};

// Inline toggles handled natively by Squire: [label, tag, title, method suffix]
const NATIVE_BUTTONS = [
  ["B",  "B",   "Bold (b)",          "Bold"],
  ["I",  "I",   "Italic (i)",        "Italic"],
  ["U",  "U",   "Underline (u)",     "Underline"],
  ["S",  "S",   "Strikethrough (s)", "Strikethrough"],
  ["x²", "SUP", "Superscript (sup)", "Superscript"],
  ["x₂", "SUB", "Subscript (sub)",   "Subscript"],
];

// Inline toggles via changeFormat: [label, tag, title]
const EXTRA_BUTTONS = [
  ["ins", "INS",   "Inserted (ins)"],
  ["sml", "SMALL", "Small (small)"],
  ["big", "BIG",   "Big (big)"],
  ["tt",  "TT",    "Teletype (tt)"],
];

const IMAGE_HINT = "Must be a direct image link ending in .jpg, .jpeg, .png, or .gif — hosted on a permanent host (Imgur, postimages, etc.). Discord and Tumblr links expire.";
const LINK_HINT = "Select text first to turn it into a link, or the URL itself is inserted.";

// A background darker than this average luminance counts as a dark site skin.
const DARK_LUMINANCE_THRESHOLD = 128;

// ─────────────────────────────────────────────────────────────────────────────
// Small helpers
// ─────────────────────────────────────────────────────────────────────────────

function isPageDark() {
  const bg = getComputedStyle(document.body).backgroundColor;
  const m = bg.match(/\d+/g);
  if (!m) return false;
  const [r, g, b] = m.map(Number);
  // Rec. 601 luma coefficients
  return (0.299 * r + 0.587 * g + 0.114 * b) < DARK_LUMINANCE_THRESHOLD;
}

function makeButton(label, title, className) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.textContent = label;
  btn.title = title;
  btn.className = className;
  btn.tabIndex = -1;
  // keep the editor selection: buttons must not steal focus
  btn.addEventListener("mousedown", (e) => e.preventDefault());
  return btn;
}

function makeGroup(className) {
  const group = document.createElement("span");
  group.className = "ao3ce-tool-group" + (className ? " " + className : "");
  return group;
}

// Wire a toolbar button as a format toggle: remove the format if it's already
// applied, apply it otherwise, then return focus to the editor so the user's
// selection is kept.
function wireToggle(btn, squire, isActive, apply, remove) {
  btn.addEventListener("click", () => {
    isActive() ? remove() : apply();
    squire.focus();
  });
}

// Toggle the selected blocks to/from <hN>.
function toggleHeading(squire, level) {
  const tag = "H" + level;
  squire.modifyBlocks((frag) => {
    const output = document.createDocumentFragment();
    for (const node of Array.from(frag.childNodes)) {
      if (node.nodeType === Node.ELEMENT_NODE && /^(H[1-6]|P|DIV)$/.test(node.tagName)) {
        const el = document.createElement(node.tagName === tag ? "P" : tag);
        el.append(...node.childNodes);
        output.append(el);
      } else {
        output.append(node);
      }
    }
    return output;
  });
  squire.focus();
}

// ─────────────────────────────────────────────────────────────────────────────
// UI builders — each returns its root element plus the handles the caller needs
// ─────────────────────────────────────────────────────────────────────────────

// The Rich / Plain (HTML) view switcher above the toolbar.
function buildToggleBar() {
  const toggleBar = document.createElement("div");
  toggleBar.className = CLS.toggleBar;

  const richBtn = document.createElement("button");
  richBtn.type = "button";
  richBtn.textContent = "Rich";
  richBtn.title = "Rich text editor";
  richBtn.className = CLS.viewBtn + " " + CLS.viewBtnActive;

  const plainBtn = document.createElement("button");
  plainBtn.type = "button";
  plainBtn.textContent = "Plain (HTML)";
  plainBtn.title = "Edit the raw HTML by hand";
  plainBtn.className = CLS.viewBtn;

  toggleBar.append(richBtn, plainBtn);
  return { toggleBar, richBtn, plainBtn };
}

// The formatting toolbar: inline toggles, h1–h6, block formats, link/image.
function buildToolbar(squire) {
  const toolbar = document.createElement("div");
  toolbar.className = CLS.toolbar;

  // [button, isActive] pairs; isActive() decides the highlight for each button
  // as the selection moves, so the mapping lives in one place per button.
  const trackedButtons = [];
  function track(btn, isActive) {
    trackedButtons.push([btn, isActive]);
  }

  // ── Inline formats (b, i, u, s, sup, sub, ins, small, big, tt) ──
  const inlineGroup = makeGroup();
  for (const [label, tag, title, method] of NATIVE_BUTTONS) {
    const btn = makeButton(label, title, CLS.tool);
    const isActive = () => squire.hasFormat(tag);
    wireToggle(btn, squire, isActive,
      () => squire[method.toLowerCase()](),
      () => squire["remove" + method]());
    track(btn, isActive);
    inlineGroup.append(btn);
  }
  for (const [label, tag, title] of EXTRA_BUTTONS) {
    const btn = makeButton(label, title, CLS.tool + " " + CLS.toolMono);
    const isActive = () => squire.hasFormat(tag);
    wireToggle(btn, squire, isActive,
      () => squire.changeFormat({ tag }, null),
      () => squire.changeFormat(null, { tag }));
    track(btn, isActive);
    inlineGroup.append(btn);
  }

  // ── Headings: h1–h6 in a compact grid group ──
  const headingsGroup = makeGroup(CLS.headingsGroup);
  for (let n = 1; n <= 6; n++) {
    const btn = makeButton("H" + n, "Heading " + n + " (h" + n + ")", CLS.tool + " " + CLS.headingBtn);
    btn.addEventListener("click", () => toggleHeading(squire, n));
    headingsGroup.append(btn);
  }

  // ── Block formats: blockquote, code, lists ──
  const blockGroup = makeGroup();

  const quoteBtn = makeButton("❝", "Blockquote (blockquote)", CLS.tool);
  const quoteActive = () => squire.hasFormat("BLOCKQUOTE");
  wireToggle(quoteBtn, squire, quoteActive,
    () => squire.increaseQuoteLevel(),
    () => squire.decreaseQuoteLevel());
  track(quoteBtn, quoteActive);

  // toggleCode handles both directions itself, so no wireToggle here.
  const codeBtn = makeButton("</>", "Code (code / pre)", CLS.tool + " " + CLS.toolMono);
  codeBtn.addEventListener("click", () => {
    squire.toggleCode();
    squire.focus();
  });
  track(codeBtn, () => squire.hasFormat("PRE") || squire.hasFormat("CODE"));

  const ulBtn = makeButton("•—", "Bulleted list (ul)", CLS.tool);
  const ulActive = () => squire.hasFormat("UL");
  wireToggle(ulBtn, squire, ulActive,
    () => squire.makeUnorderedList(),
    () => squire.removeList());
  track(ulBtn, ulActive);

  const olBtn = makeButton("1.—", "Numbered list (ol)", CLS.tool);
  const olActive = () => squire.hasFormat("OL");
  wireToggle(olBtn, squire, olActive,
    () => squire.makeOrderedList(),
    () => squire.removeList());
  track(olBtn, olActive);

  blockGroup.append(quoteBtn, codeBtn, ulBtn, olBtn);

  // ── Insert: link + image (open the shared URL row, wired by the caller) ──
  const insertGroup = makeGroup();
  const linkBtn = makeButton("🔗", "Insert link by URL", CLS.tool);
  const imageBtn = makeButton("IMG", "Insert image by URL", CLS.tool + " " + CLS.imageBtn);
  insertGroup.append(linkBtn, imageBtn);

  // ── Clear formatting: strips the selection back to plain text ──
  const clearGroup = makeGroup();
  const clearBtn = makeButton("Clear", "Clear formatting", CLS.tool);
  clearBtn.addEventListener("click", () => {
    squire.removeAllFormatting();
    squire.focus();
  });
  clearGroup.append(clearBtn);

  toolbar.append(inlineGroup, headingsGroup, blockGroup, insertGroup, clearGroup);

  // highlight active formats as the selection moves
  function updateActiveStates() {
    for (const [btn, isActive] of trackedButtons) {
      btn.classList.toggle(CLS.toolActive, isActive());
    }
  }
  squire.addEventListener("pathChange", updateActiveStates);
  squire.addEventListener("select", updateActiveStates);

  return { toolbar, linkBtn, imageBtn };
}

// The URL prompt row shared by the link and image buttons.
function buildUrlRow(squire) {
  const urlRow = document.createElement("div");
  urlRow.className = CLS.urlRow;
  let mode = null; // "link" | "image"

  const urlInput = document.createElement("input");
  urlInput.type = "url";

  const insertBtn = document.createElement("button");
  insertBtn.type = "button";
  insertBtn.textContent = "Insert";
  insertBtn.title = "Insert (Enter)";

  const cancelBtn = document.createElement("button");
  cancelBtn.type = "button";
  cancelBtn.textContent = "Cancel";
  cancelBtn.title = "Cancel (Esc)";

  const unlinkBtn = document.createElement("button");
  unlinkBtn.type = "button";
  unlinkBtn.textContent = "Unlink";
  unlinkBtn.title = "Remove the link from the selected text";

  const hint = document.createElement("small");
  hint.className = CLS.urlHint;

  urlRow.append(urlInput, insertBtn, unlinkBtn, cancelBtn, hint);

  // Clicking the same toolbar button again while open acts as a toggle.
  function openUrlRow(newMode) {
    if (urlRow.style.display === "flex" && mode === newMode) {
      closeUrlRow();
      return;
    }
    mode = newMode;
    urlInput.placeholder = mode === "image" ? "Image URL…" : "Link URL…";
    hint.textContent = mode === "image" ? IMAGE_HINT : LINK_HINT;
    unlinkBtn.style.display = mode === "link" ? "" : "none";
    urlRow.style.display = "flex";
    urlInput.focus();
  }

  function closeUrlRow() {
    urlRow.style.display = "none";
    urlInput.value = "";
    mode = null;
  }

  insertBtn.addEventListener("click", () => {
    const url = urlInput.value.trim();
    if (!url) return;
    if (mode === "image") {
      squire.insertImage(url, { alt: "" });
    } else {
      squire.makeLink(url);
    }
    closeUrlRow();
    squire.focus();
  });

  unlinkBtn.addEventListener("click", () => {
    squire.removeLink();
    closeUrlRow();
    squire.focus();
  });

  cancelBtn.addEventListener("click", closeUrlRow);

  urlInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); insertBtn.click(); }
    if (e.key === "Escape") cancelBtn.click();
  });

  return { urlRow, openUrlRow, closeUrlRow };
}

// ─────────────────────────────────────────────────────────────────────────────
// Editor injection — orchestrates the builders around one AO3 comment textarea
// ─────────────────────────────────────────────────────────────────────────────

function injectEditor(textarea) {
  // Check the DOM itself, not an in-memory flag: a WeakSet only survives for
  // the lifetime of one script execution, so it can't detect a wrapper left
  // over from a previous injection (e.g. an extension reload into an
  // already-open page during development).
  if (textarea.previousElementSibling?.classList.contains(CLS.wrapper)) return;

  const wrapper = document.createElement("div");
  wrapper.className = CLS.wrapper + (isPageDark() ? " " + CLS.dark : "");

  const editorEl = document.createElement("div");
  editorEl.className = CLS.editor;

  const squire = new Squire(editorEl, {
    blockTag: "P",
    sanitizeToDOMFragment: sanitizeToFragment,
  });

  const { toggleBar, richBtn, plainBtn } = buildToggleBar();
  const { toolbar, linkBtn, imageBtn } = buildToolbar(squire);
  const { urlRow, openUrlRow, closeUrlRow } = buildUrlRow(squire);

  linkBtn.addEventListener("click", () => openUrlRow("link"));
  imageBtn.addEventListener("click", () => openUrlRow("image"));

  wrapper.append(toggleBar, toolbar, editorEl, urlRow);
  textarea.parentNode.insertBefore(wrapper, textarea);
  textarea.classList.add(CLS.plainTextarea);
  if (isPageDark()) textarea.classList.add(CLS.dark);
  textarea.style.display = "none";

  if (textarea.value.trim()) {
    squire.setHTML(textarea.value);
  }

  // sync Squire → AO3 textarea on every change so the form submits correctly
  squire.addEventListener("input", () => {
    textarea.value = sanitizeToString(squire.getHTML());
  });

  function showRich() {
    richBtn.classList.add(CLS.viewBtnActive);
    plainBtn.classList.remove(CLS.viewBtnActive);

    // match height to what the plain textarea currently is
    editorEl.style.height = textarea.offsetHeight + "px";
    textarea.style.display = "none";

    squire.setHTML(textarea.value);

    toolbar.style.display = "";
    editorEl.style.display = "";
  }

  function showPlain() {
    plainBtn.classList.add(CLS.viewBtnActive);
    richBtn.classList.remove(CLS.viewBtnActive);

    // flush current editor content and match height to the editor area
    textarea.value = sanitizeToString(squire.getHTML());
    textarea.style.height = editorEl.offsetHeight + "px";

    toolbar.style.display = "none";
    editorEl.style.display = "none";
    closeUrlRow();
    textarea.style.display = "";
  }

  richBtn.addEventListener("click", showRich);
  plainBtn.addEventListener("click", showPlain);
}

// ─────────────────────────────────────────────────────────────────────────────
// Page scanning
// ─────────────────────────────────────────────────────────────────────────────

function scanAndInject() {
  document.querySelectorAll(COMMENT_TEXTAREA_SELECTOR).forEach(injectEditor);
}

scanAndInject();

// AO3 loads reply/edit comment forms via AJAX, so watch for new textareas.
const observer = new MutationObserver(() => scanAndInject());
observer.observe(document.body, { childList: true, subtree: true });

// CommonJS export guard so Jest can unit-test this file;
// in the extension this file runs as a plain content script.
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    isPageDark,
    makeButton,
    makeGroup,
    toggleHeading,
    buildToggleBar,
    buildToolbar,
    buildUrlRow,
    injectEditor,
    scanAndInject,
    observer,
  };
}
