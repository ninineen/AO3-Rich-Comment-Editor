/* AO3 Comment Editor — content script.
   Sanitizer functions (sanitizeToFragment, sanitizeToString) come from
   content/sanitizer.js, loaded before this file per manifest.json. */

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

const injected = new WeakSet();

function isPageDark() {
  const bg = getComputedStyle(document.body).backgroundColor;
  // parse rgb(r, g, b) and check luminance
  const m = bg.match(/\d+/g);
  if (!m) return false;
  const [r, g, b] = m.map(Number);
  return (0.299 * r + 0.587 * g + 0.114 * b) < 128;
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

function injectEditor(textarea) {
  if (injected.has(textarea)) return;
  injected.add(textarea);

  const wrapper = document.createElement("div");
  wrapper.className = "ao3ce-wrapper" + (isPageDark() ? " ao3ce-dark" : "");

  const toggleBar = document.createElement("div");
  toggleBar.className = "ao3ce-toggle";

  const richBtn = document.createElement("button");
  richBtn.type = "button";
  richBtn.textContent = "Rich";
  richBtn.className = "ao3ce-btn ao3ce-btn--active";

  const plainBtn = document.createElement("button");
  plainBtn.type = "button";
  plainBtn.textContent = "Plain (HTML)";
  plainBtn.className = "ao3ce-btn";

  toggleBar.append(richBtn, plainBtn);

  // ── Toolbar ──
  const toolbar = document.createElement("div");
  toolbar.className = "ao3ce-toolbar";

  const editorEl = document.createElement("div");
  editorEl.className = "ao3ce-editor";

  const squire = new Squire(editorEl, {
    blockTag: "P",
    sanitizeToDOMFragment: sanitizeToFragment,
  });

  const inlineButtons = []; // [button, tag] pairs for active-state updates

  const inlineGroup = makeGroup();
  for (const [label, tag, title, method] of NATIVE_BUTTONS) {
    const btn = makeButton(label, title, "ao3ce-tool");
    btn.addEventListener("click", () => {
      squire.hasFormat(tag) ? squire["remove" + method]() : squire[method.toLowerCase()]();
      squire.focus();
    });
    inlineButtons.push([btn, tag]);
    inlineGroup.append(btn);
  }
  for (const [label, tag, title] of EXTRA_BUTTONS) {
    const btn = makeButton(label, title, "ao3ce-tool ao3ce-tool--mono");
    btn.addEventListener("click", () => {
      squire.hasFormat(tag)
        ? squire.changeFormat(null, { tag })
        : squire.changeFormat({ tag }, null);
      squire.focus();
    });
    inlineButtons.push([btn, tag]);
    inlineGroup.append(btn);
  }

  // h1–h6 in a compact grid group
  const headingsGroup = makeGroup("ao3ce-headings-group");
  for (let n = 1; n <= 6; n++) {
    const btn = makeButton("H" + n, "Heading " + n + " (h" + n + ")", "ao3ce-tool ao3ce-heading-btn");
    btn.addEventListener("click", () => toggleHeading(squire, n));
    headingsGroup.append(btn);
  }

  const blockGroup = makeGroup();

  const quoteBtn = makeButton("❝", "Blockquote (blockquote)", "ao3ce-tool");
  quoteBtn.addEventListener("click", () => {
    squire.hasFormat("BLOCKQUOTE") ? squire.decreaseQuoteLevel() : squire.increaseQuoteLevel();
    squire.focus();
  });

  const codeBtn = makeButton("</>", "Code (code / pre)", "ao3ce-tool ao3ce-tool--mono");
  codeBtn.addEventListener("click", () => {
    squire.toggleCode();
    squire.focus();
  });

  const ulBtn = makeButton("•—", "Bulleted list (ul)", "ao3ce-tool");
  ulBtn.addEventListener("click", () => {
    squire.hasFormat("UL") ? squire.removeList() : squire.makeUnorderedList();
    squire.focus();
  });

  const olBtn = makeButton("1.—", "Numbered list (ol)", "ao3ce-tool");
  olBtn.addEventListener("click", () => {
    squire.hasFormat("OL") ? squire.removeList() : squire.makeOrderedList();
    squire.focus();
  });

  blockGroup.append(quoteBtn, codeBtn, ulBtn, olBtn);

  const insertGroup = makeGroup();
  const linkBtn = makeButton("🔗", "Insert link by URL", "ao3ce-tool");
  const imageBtn = makeButton("IMG", "Insert image by URL", "ao3ce-tool ao3ce-image-btn");
  insertGroup.append(linkBtn, imageBtn);

  toolbar.append(inlineGroup, headingsGroup, blockGroup, insertGroup);

  // highlight active inline formats as the selection moves
  function updateActiveStates() {
    for (const [btn, tag] of inlineButtons) {
      btn.classList.toggle("ao3ce-tool--active", squire.hasFormat(tag));
    }
    quoteBtn.classList.toggle("ao3ce-tool--active", squire.hasFormat("BLOCKQUOTE"));
    ulBtn.classList.toggle("ao3ce-tool--active", squire.hasFormat("UL"));
    olBtn.classList.toggle("ao3ce-tool--active", squire.hasFormat("OL"));
  }
  squire.addEventListener("pathChange", updateActiveStates);
  squire.addEventListener("select", updateActiveStates);

  // ── URL prompt row (shared by link + image buttons) ──
  const urlRow = document.createElement("div");
  urlRow.className = "ao3ce-image-row";
  let urlRowMode = null; // "link" | "image"

  const urlInput = document.createElement("input");
  urlInput.type = "url";

  const urlInsertBtn = document.createElement("button");
  urlInsertBtn.type = "button";
  urlInsertBtn.textContent = "Insert";

  const urlCancelBtn = document.createElement("button");
  urlCancelBtn.type = "button";
  urlCancelBtn.textContent = "Cancel";

  const unlinkBtn = document.createElement("button");
  unlinkBtn.type = "button";
  unlinkBtn.textContent = "Unlink";

  const urlHint = document.createElement("small");
  urlHint.className = "ao3ce-image-hint";

  urlRow.append(urlInput, urlInsertBtn, unlinkBtn, urlCancelBtn, urlHint);

  const IMAGE_HINT = "Must be a direct image link ending in .jpg, .jpeg, .png, or .gif — hosted on a permanent host (Imgur, postimages, etc.). Discord and Tumblr links expire.";
  const LINK_HINT = "Select text first to turn it into a link, or the URL itself is inserted.";

  function openUrlRow(mode) {
    if (urlRow.style.display === "flex" && urlRowMode === mode) {
      closeUrlRow();
      return;
    }
    urlRowMode = mode;
    urlInput.placeholder = mode === "image" ? "Image URL…" : "Link URL…";
    urlHint.textContent = mode === "image" ? IMAGE_HINT : LINK_HINT;
    unlinkBtn.style.display = mode === "link" ? "" : "none";
    urlRow.style.display = "flex";
    urlInput.focus();
  }

  function closeUrlRow() {
    urlRow.style.display = "none";
    urlInput.value = "";
    urlRowMode = null;
  }

  linkBtn.addEventListener("click", () => openUrlRow("link"));
  imageBtn.addEventListener("click", () => openUrlRow("image"));
  urlCancelBtn.addEventListener("click", closeUrlRow);

  unlinkBtn.addEventListener("click", () => {
    squire.removeLink();
    closeUrlRow();
    squire.focus();
  });

  urlInsertBtn.addEventListener("click", () => {
    const url = urlInput.value.trim();
    if (!url) return;
    if (urlRowMode === "image") {
      squire.insertImage(url, { alt: "" });
    } else {
      squire.makeLink(url);
    }
    closeUrlRow();
    squire.focus();
  });

  urlInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); urlInsertBtn.click(); }
    if (e.key === "Escape") urlCancelBtn.click();
  });

  wrapper.append(toggleBar, toolbar, editorEl, urlRow);
  textarea.parentNode.insertBefore(wrapper, textarea);
  textarea.classList.add("ao3ce-plain-textarea");
  if (isPageDark()) textarea.classList.add("ao3ce-dark");
  textarea.style.display = "none";

  if (textarea.value.trim()) {
    squire.setHTML(textarea.value);
  }

  // sync Squire → AO3 textarea on every change so the form submits correctly
  squire.addEventListener("input", () => {
    textarea.value = sanitizeToString(squire.getHTML());
  });

  function showRich() {
    richBtn.classList.add("ao3ce-btn--active");
    plainBtn.classList.remove("ao3ce-btn--active");

    // match height to what the plain textarea currently is
    editorEl.style.height = textarea.offsetHeight + "px";
    textarea.style.display = "none";

    squire.setHTML(textarea.value);

    toolbar.style.display = "";
    editorEl.style.display = "";
  }

  function showPlain() {
    plainBtn.classList.add("ao3ce-btn--active");
    richBtn.classList.remove("ao3ce-btn--active");

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

function scanAndInject() {
  document.querySelectorAll("textarea[id^='comment_content_for']").forEach(injectEditor);
}

scanAndInject();

const observer = new MutationObserver(() => scanAndInject());
observer.observe(document.body, { childList: true, subtree: true });
