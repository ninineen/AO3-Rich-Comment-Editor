/* AO3 Comment Editor — first-party allowlist sanitizer */

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

// Disallowed tags whose text content must not leak into the output.
const DROP_WITH_CONTENT = [
  "script","style","title","textarea","iframe","object","embed","noscript",
];

// Walk a parsed tree: unwrap disallowed elements (keeping their children),
// strip disallowed attributes, and restrict href/src to http(s) URLs.
function cleanNode(node) {
  for (const child of Array.from(node.childNodes)) {
    if (child.nodeType === Node.ELEMENT_NODE) {
      cleanNode(child);
      const tag = child.tagName.toLowerCase();
      if (!ALLOWED_TAGS.includes(tag)) {
        if (DROP_WITH_CONTENT.includes(tag)) {
          child.remove();
        } else {
          while (child.firstChild) node.insertBefore(child.firstChild, child);
          child.remove();
        }
        continue;
      }
      for (const attr of Array.from(child.attributes)) {
        const name = attr.name.toLowerCase();
        if (!ALLOWED_ATTR.includes(name)) {
          child.removeAttribute(attr.name);
          continue;
        }
        if (name === "href" || name === "src") {
          let ok = false;
          try {
            const url = new URL(attr.value, "https://archiveofourown.org/");
            ok = url.protocol === "http:" || url.protocol === "https:";
          } catch (e) { /* unparseable URL — drop it */ }
          if (!ok) child.removeAttribute(attr.name);
        }
      }
    } else if (child.nodeType !== Node.TEXT_NODE) {
      // comments, CDATA, processing instructions
      child.remove();
    }
  }
}

function sanitizeToFragment(html) {
  const doc = new DOMParser().parseFromString(String(html), "text/html");
  cleanNode(doc.body);
  const frag = document.createDocumentFragment();
  for (const child of Array.from(doc.body.childNodes)) {
    frag.appendChild(document.importNode(child, true));
  }
  return frag;
}

function sanitizeToString(html) {
  const scratch = document.createElement("div");
  scratch.append(sanitizeToFragment(html));
  return scratch.innerHTML;
}

// CommonJS export guard so Jest can unit-test the sanitizer;
// in the extension this file runs as a plain content script.
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    DROP_WITH_CONTENT,
    cleanNode,
    sanitizeToFragment,
    sanitizeToString,
  };
}
