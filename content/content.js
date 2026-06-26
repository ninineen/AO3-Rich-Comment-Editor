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

function sanitize(html) {
  return DOMPurify.sanitize(html, { ALLOWED_TAGS, ALLOWED_ATTR, KEEP_CONTENT: true });
}

const injected = new WeakSet();
let editorCounter = 0;

function injectEditor(textarea) {
  if (injected.has(textarea)) return;
  injected.add(textarea);

  const wrapper = document.createElement("div");
  wrapper.className = "ao3ce-wrapper";

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

  const inputId = `ao3ce-input-${++editorCounter}`;
  const hiddenInput = document.createElement("input");
  hiddenInput.type = "hidden";
  hiddenInput.id = inputId;

  const editorEl = document.createElement("trix-editor");
  editorEl.setAttribute("input", inputId);
  editorEl.className = "ao3ce-editor";

  // image URL row (shown/hidden via Image button in toggle bar)
  const imageRow = document.createElement("div");
  imageRow.className = "ao3ce-image-row";

  const imageInput = document.createElement("input");
  imageInput.type = "url";
  imageInput.placeholder = "Image URL…";

  const imageInsertBtn = document.createElement("button");
  imageInsertBtn.type = "button";
  imageInsertBtn.textContent = "Insert";

  const imageCancelBtn = document.createElement("button");
  imageCancelBtn.type = "button";
  imageCancelBtn.textContent = "Cancel";

  const imageHint = document.createElement("small");
  imageHint.className = "ao3ce-image-hint";
  imageHint.textContent = "Must be a direct image link ending in .jpg, .jpeg, .png, or .gif — hosted on a permanent host (Imgur, Pillowfort, etc.). Discord and Tumblr links expire.";

  imageRow.append(imageInput, imageInsertBtn, imageCancelBtn, imageHint);

  wrapper.append(toggleBar, hiddenInput, editorEl, imageRow);
  textarea.parentNode.insertBefore(wrapper, textarea);
  textarea.classList.add("ao3ce-plain-textarea");
  textarea.style.display = "none";

  let trixReady = false;

  editorEl.addEventListener("trix-initialize", () => {
    trixReady = true;
    if (textarea.value.trim()) {
      editorEl.editor.loadHTML(textarea.value);
    }

    // inject Image button into the toolbar
    const toolbar = wrapper.querySelector("trix-toolbar");
    if (toolbar) {
      const imageBtn = document.createElement("button");
      imageBtn.type = "button";
      imageBtn.textContent = "IMG";
      imageBtn.className = "trix-button ao3ce-image-btn";
      imageBtn.setAttribute("title", "Insert image by URL");
      imageBtn.tabIndex = -1;

      const fileTools = toolbar.querySelector(".trix-button-group--file-tools");
      if (fileTools) fileTools.append(imageBtn);

      imageBtn.addEventListener("click", () => {
        const open = imageRow.style.display === "flex";
        imageRow.style.display = open ? "none" : "flex";
        if (!open) imageInput.focus();
      });
    }
  }, { once: true });

  // sync Trix → AO3 textarea on every change so the form submits correctly
  editorEl.addEventListener("trix-change", () => {
    textarea.value = sanitize(hiddenInput.value);
  });

  function showRich() {
    richBtn.classList.add("ao3ce-btn--active");
    plainBtn.classList.remove("ao3ce-btn--active");

    // match height to what the plain textarea currently is
    editorEl.style.height = textarea.offsetHeight + "px";
    textarea.style.display = "none";

    if (trixReady) {
      editorEl.editor.loadHTML(sanitize(textarea.value));
    }

    wrapper.querySelectorAll("trix-toolbar, trix-editor").forEach(el => el.style.display = "");
  }

  function showPlain() {
    plainBtn.classList.add("ao3ce-btn--active");
    richBtn.classList.remove("ao3ce-btn--active");

    // flush current Trix content and match height to the editor area
    if (trixReady) {
      textarea.value = sanitize(hiddenInput.value);
    }
    textarea.style.height = editorEl.offsetHeight + "px";

    wrapper.querySelectorAll("trix-toolbar, trix-editor").forEach(el => el.style.display = "none");
    textarea.style.display = "";
  }

  richBtn.addEventListener("click", showRich);
  plainBtn.addEventListener("click", showPlain);

  imageCancelBtn.addEventListener("click", () => {
    imageRow.style.display = "none";
    imageInput.value = "";
  });

  imageInsertBtn.addEventListener("click", () => {
    const url = imageInput.value.trim();
    if (!url) return;
    if (trixReady) {
      editorEl.editor.insertHTML(`<img src="${url}" alt="">`);
    }
    imageRow.style.display = "none";
    imageInput.value = "";
    editorEl.focus();
  });

  imageInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") imageInsertBtn.click();
    if (e.key === "Escape") imageCancelBtn.click();
  });
}

function scanAndInject() {
  document.querySelectorAll("textarea[id^='comment_content_for']").forEach(injectEditor);
}

scanAndInject();

const observer = new MutationObserver(() => scanAndInject());
observer.observe(document.body, { childList: true, subtree: true });
