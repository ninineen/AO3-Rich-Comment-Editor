/** @jest-environment jsdom */

function makeFakeSquire() {
  const squire = {
    _html: "",
    setHTML(h) { squire._html = h; },
    getHTML() { return squire._html; },
    hasFormat: jest.fn(() => false),
    focus: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    modifyBlocks: jest.fn(),
    toggleCode: jest.fn(),
    makeUnorderedList: jest.fn(),
    makeOrderedList: jest.fn(),
    removeList: jest.fn(),
    increaseQuoteLevel: jest.fn(),
    decreaseQuoteLevel: jest.fn(),
    insertImage: jest.fn(),
    makeLink: jest.fn(),
    removeLink: jest.fn(),
    changeFormat: jest.fn(),
  };
  for (const method of [
    "bold", "removeBold", "italic", "removeItalic",
    "underline", "removeUnderline", "strikethrough", "removeStrikethrough",
    "superscript", "removeSuperscript", "subscript", "removeSubscript",
  ]) {
    squire[method] = jest.fn();
  }
  return squire;
}

// content.js expects Squire / sanitizeToFragment / sanitizeToString as
// globals injected by the manifest's script load order; stand those in
// before each require so we get a fresh module instance per test.
let activeModule = null;

function loadContentModule() {
  activeModule?.observer.disconnect();
  jest.resetModules();
  global.sanitizeToFragment = jest.fn(() => document.createDocumentFragment());
  global.sanitizeToString = jest.fn((html) => `sanitized(${html})`);
  global.Squire = jest.fn(() => makeFakeSquire());
  document.body.innerHTML = "";
  activeModule = require("../content/content.js");
  return activeModule;
}

afterEach(() => {
  activeModule?.observer.disconnect();
  activeModule = null;
  document.body.style.backgroundColor = "";
  jest.restoreAllMocks();
});

describe("isPageDark", () => {
  test("returns false for a light background", () => {
    const { isPageDark } = loadContentModule();
    document.body.style.backgroundColor = "rgb(255, 255, 255)";
    expect(isPageDark()).toBe(false);
  });

  test("returns true for a dark background", () => {
    const { isPageDark } = loadContentModule();
    document.body.style.backgroundColor = "rgb(10, 10, 10)";
    expect(isPageDark()).toBe(true);
  });

  test("returns false when background color can't be parsed", () => {
    const { isPageDark } = loadContentModule();
    jest.spyOn(window, "getComputedStyle").mockReturnValue({ backgroundColor: "" });
    expect(isPageDark()).toBe(false);
  });
});

describe("makeButton", () => {
  test("builds a type=button with label, title, and class", () => {
    const { makeButton } = loadContentModule();
    const btn = makeButton("B", "Bold (b)", "ao3ce-tool");
    expect(btn.tagName).toBe("BUTTON");
    expect(btn.type).toBe("button");
    expect(btn.textContent).toBe("B");
    expect(btn.title).toBe("Bold (b)");
    expect(btn.className).toBe("ao3ce-tool");
    expect(btn.tabIndex).toBe(-1);
  });

  test("prevents default on mousedown so the editor selection survives", () => {
    const { makeButton } = loadContentModule();
    const btn = makeButton("B", "Bold", "ao3ce-tool");
    const evt = new MouseEvent("mousedown", { bubbles: true, cancelable: true });
    btn.dispatchEvent(evt);
    expect(evt.defaultPrevented).toBe(true);
  });
});

describe("makeGroup", () => {
  test("builds a span with the base class", () => {
    const { makeGroup } = loadContentModule();
    const group = makeGroup();
    expect(group.tagName).toBe("SPAN");
    expect(group.className).toBe("ao3ce-tool-group");
  });

  test("appends an extra class when given one", () => {
    const { makeGroup } = loadContentModule();
    const group = makeGroup("ao3ce-headings-group");
    expect(group.className).toBe("ao3ce-tool-group ao3ce-headings-group");
  });
});

describe("toggleHeading", () => {
  function runModifyBlocks(squire) {
    const frag = squire.modifyBlocks.mock.calls[0][0];
    return frag(document.createDocumentFragment.call(document));
  }

  test("converts a P block to the requested heading level", () => {
    const { toggleHeading } = loadContentModule();
    const squire = makeFakeSquire();
    const input = document.createDocumentFragment();
    const p = document.createElement("P");
    p.textContent = "hello";
    input.append(p);

    toggleHeading(squire, 2);
    const output = squire.modifyBlocks.mock.calls[0][0](input);

    expect(output.firstChild.tagName).toBe("H2");
    expect(output.firstChild.textContent).toBe("hello");
    expect(squire.focus).toHaveBeenCalled();
  });

  test("toggles back to P when the block already has that heading level", () => {
    const { toggleHeading } = loadContentModule();
    const squire = makeFakeSquire();
    const input = document.createDocumentFragment();
    const h3 = document.createElement("H3");
    h3.textContent = "already a heading";
    input.append(h3);

    toggleHeading(squire, 3);
    const output = squire.modifyBlocks.mock.calls[0][0](input);

    expect(output.firstChild.tagName).toBe("P");
    expect(output.firstChild.textContent).toBe("already a heading");
  });

  test("leaves non-block nodes untouched", () => {
    const { toggleHeading } = loadContentModule();
    const squire = makeFakeSquire();
    const input = document.createDocumentFragment();
    const table = document.createElement("TABLE");
    input.append(table);

    toggleHeading(squire, 1);
    const output = squire.modifyBlocks.mock.calls[0][0](input);

    expect(output.firstChild).toBe(table);
  });
});

describe("injectEditor", () => {
  function makeTextarea(id, value) {
    const ta = document.createElement("textarea");
    ta.id = id;
    ta.value = value;
    document.body.append(ta);
    return ta;
  }

  test("wraps the textarea in an ao3ce-wrapper and hides it", () => {
    const { injectEditor } = loadContentModule();
    const ta = makeTextarea("comment_content_for_1", "<p>hi</p>");

    injectEditor(ta);

    expect(ta.previousElementSibling.classList.contains("ao3ce-wrapper")).toBe(true);
    expect(ta.classList.contains("ao3ce-plain-textarea")).toBe(true);
    expect(ta.style.display).toBe("none");
  });

  test("seeds the rich editor with the textarea's existing value", () => {
    const { injectEditor } = loadContentModule();
    const ta = makeTextarea("comment_content_for_2", "<p>seed</p>");

    injectEditor(ta);

    expect(global.Squire.mock.results[0].value.getHTML()).toBe("<p>seed</p>");
  });

  test("does not double-inject on repeated calls", () => {
    const { injectEditor } = loadContentModule();
    const ta = makeTextarea("comment_content_for_3", "");

    injectEditor(ta);
    injectEditor(ta);

    const wrappers = document.querySelectorAll(".ao3ce-wrapper");
    expect(wrappers.length).toBe(1);
    expect(global.Squire).toHaveBeenCalledTimes(1);
  });

  test("marks the wrapper and textarea dark when the page background is dark", () => {
    const { injectEditor } = loadContentModule();
    document.body.style.backgroundColor = "rgb(0, 0, 0)";
    const ta = makeTextarea("comment_content_for_4", "");

    injectEditor(ta);

    expect(ta.previousElementSibling.classList.contains("ao3ce-dark")).toBe(true);
    expect(ta.classList.contains("ao3ce-dark")).toBe(true);
  });

  test("Plain toggle flushes sanitized editor HTML back to the textarea and shows it", () => {
    const { injectEditor } = loadContentModule();
    const ta = makeTextarea("comment_content_for_5", "");

    injectEditor(ta);
    const squire = global.Squire.mock.results[0].value;
    squire.setHTML("<p>edited</p>");

    const wrapper = ta.previousElementSibling;
    const plainBtn = Array.from(wrapper.querySelectorAll(".ao3ce-btn"))
      .find((b) => b.textContent === "Plain (HTML)");

    plainBtn.click();

    expect(global.sanitizeToString).toHaveBeenCalledWith("<p>edited</p>");
    expect(ta.value).toBe("sanitized(<p>edited</p>)");
    expect(ta.style.display).toBe("");
  });

  test("Rich toggle re-hides the textarea and reloads its value into the editor", () => {
    const { injectEditor } = loadContentModule();
    const ta = makeTextarea("comment_content_for_6", "");

    injectEditor(ta);
    const squire = global.Squire.mock.results[0].value;

    const wrapper = ta.previousElementSibling;
    const [richBtn, plainBtn] = wrapper.querySelectorAll(".ao3ce-btn");
    plainBtn.click();
    ta.value = "<p>typed in plain mode</p>";
    richBtn.click();

    expect(squire.getHTML()).toBe("<p>typed in plain mode</p>");
    expect(ta.style.display).toBe("none");
  });

  test("syncs Squire input events to the textarea through the sanitizer", () => {
    const { injectEditor } = loadContentModule();
    const ta = makeTextarea("comment_content_for_7", "");

    injectEditor(ta);
    const squire = global.Squire.mock.results[0].value;
    squire.setHTML("<b>bold</b>");

    const inputHandler = squire.addEventListener.mock.calls
      .find(([event]) => event === "input")[1];
    inputHandler();

    expect(ta.value).toBe("sanitized(<b>bold</b>)");
  });
});

describe("scanAndInject", () => {
  test("injects only into textareas whose id starts with comment_content_for", () => {
    const { scanAndInject } = loadContentModule();
    const match = document.createElement("textarea");
    match.id = "comment_content_for_99";
    document.body.append(match);

    const other = document.createElement("textarea");
    other.id = "some_other_textarea";
    document.body.append(other);

    scanAndInject();

    expect(match.previousElementSibling?.classList.contains("ao3ce-wrapper")).toBe(true);
    expect(other.classList.contains("ao3ce-plain-textarea")).toBe(false);
    expect(other.style.display).not.toBe("none");
  });
});
