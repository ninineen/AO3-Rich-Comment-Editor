/* AO3 Comment Editor — content script */

const ALLOWED_TAGS = [
  "a","abbr","acronym","address","b","big","blockquote","br",
  "caption","center","cite","code","col","colgroup","dd","del",
  "details","dfn","div","dl","dt","em","figcaption","figure",
  "h1","h2","h3","h4","h5","h6","hr","i","img","ins","kbd",
  "li","ol","p","pre","q","ruby","rt","rp","s","samp","small",
  "span","strike","strong","sub","summary","sup","table","tbody",
  "td","tfoot","th","thead","tr","tt","u","ul","var",
];

const ALLOWED_ATTR = [
  "align","alt","axis","class","dir","height","href","name",
  "src","title","width",
];

const TOOLBAR = [
  [{ header: [1, 2, 3, 4, 5, 6, false] }],
  ["bold", "italic", "underline", "strike"],
  [{ script: "sub" }, { script: "super" }],
  ["blockquote", "code-block"],
  [{ list: "ordered" }, { list: "bullet" }],
  ["link"],
  ["clean"],
];

function sanitize(html) {
  return DOMPurify.sanitize(html, { ALLOWED_TAGS, ALLOWED_ATTR, KEEP_CONTENT: true });
}

function stripTrailingBrs(html) {
  return html.replace(/(<br\s*\/?>)+$/i, "");
}

function getEditorHtml(quill) {
  const inner = quill.root.innerHTML;
  if (inner === "<p><br></p>") return "";
  return stripTrailingBrs(inner);
}

// Track injected textareas so we don't double-inject
const injected = new WeakSet();

function injectEditor(textarea) {
  if (injected.has(textarea)) return;
  injected.add(textarea);

  // --- build wrapper ---
  const wrapper = document.createElement("div");
  wrapper.className = "ao3ce-wrapper";

  // toggle bar (mirrors AO3's author edit buttons)
  const toggleBar = document.createElement("div");
  toggleBar.className = "ao3ce-toggle";

  const richBtn = document.createElement("button");
  richBtn.type = "button";
  richBtn.textContent = "Rich";
  richBtn.className = "ao3ce-btn ao3ce-btn--active";

  const plainBtn = document.createElement("button");
  plainBtn.type = "button";
  plainBtn.textContent = "Plain";
  plainBtn.className = "ao3ce-btn";

  toggleBar.append(richBtn, plainBtn);

  // quill container
  const editorEl = document.createElement("div");
  editorEl.className = "ao3ce-editor";

  wrapper.append(toggleBar, editorEl);
  textarea.parentNode.insertBefore(wrapper, textarea);

  // hide original textarea
  textarea.style.display = "none";

  // init Quill
  const quill = new Quill(editorEl, {
    theme: "snow",
    placeholder: "Write your comment here…",
    modules: { toolbar: TOOLBAR },
  });

  // seed from textarea if it already has content (e.g. edit mode)
  if (textarea.value.trim()) {
    const delta = quill.clipboard.convert({ html: textarea.value });
    quill.setContents(delta, "silent");
  }

  // sync Quill → textarea on every change
  quill.on("text-change", (_delta, _old, source) => {
    if (source === "silent") return;
    textarea.value = sanitize(getEditorHtml(quill));
  });

  // Rich / Plain toggle
  richBtn.addEventListener("click", () => {
    richBtn.classList.add("ao3ce-btn--active");
    plainBtn.classList.remove("ao3ce-btn--active");
    // load textarea content back into quill
    const delta = quill.clipboard.convert({ html: textarea.value });
    quill.setContents(delta, "silent");
    wrapper.style.display = "";
    textarea.style.display = "none";
  });

  plainBtn.addEventListener("click", () => {
    plainBtn.classList.add("ao3ce-btn--active");
    richBtn.classList.remove("ao3ce-btn--active");
    // make sure textarea has current sanitized html
    textarea.value = sanitize(getEditorHtml(quill));
    textarea.style.display = "";
    wrapper.querySelector(".ql-toolbar").style.display = "none";
    editorEl.style.display = "none";
  });

  // when switching back to rich mode, re-show toolbar+editor
  richBtn.addEventListener("click", () => {
    const qlToolbar = wrapper.querySelector(".ql-toolbar");
    if (qlToolbar) qlToolbar.style.display = "";
    editorEl.style.display = "";
  });
}

function scanAndInject() {
  document.querySelectorAll("textarea[id^='comment_content_for']").forEach(injectEditor);
}

// Initial scan
scanAndInject();

// Watch for dynamically injected reply forms
const observer = new MutationObserver(() => scanAndInject());
observer.observe(document.body, { childList: true, subtree: true });
