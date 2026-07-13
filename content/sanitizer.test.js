/** @jest-environment jsdom */

const fs = require("fs");
const path = require("path");

const {
  ALLOWED_TAGS,
  sanitizeToFragment,
  sanitizeToString,
} = require("../content/sanitizer.js");

describe("sanitizeToString", () => {
  describe("allowed content passes through", () => {
    test("keeps basic formatting tags", () => {
      const input = "<p>Hello <b>bold</b> <i>italic</i> <u>under</u> <s>strike</s></p>";
      expect(sanitizeToString(input)).toBe(input);
    });

    test("keeps every AO3-allowed tag", () => {
      // void tags and table-structure tags need special wrapping to survive a
      // parse round-trip, so check the common container tags generically
      const simple = ALLOWED_TAGS.filter(t => ![
        "br","hr","img","col","colgroup","caption","dd","dt","li","rt","rp",
        "table","tbody","td","tfoot","th","thead","tr",
      ].includes(t));
      for (const tag of simple) {
        const input = `<${tag}>x</${tag}>`;
        expect(sanitizeToString(input)).toBe(input);
      }
    });

    test("keeps tables", () => {
      const input = "<table><tbody><tr><td>cell</td></tr></tbody></table>";
      expect(sanitizeToString(input)).toBe(input);
    });

    test("keeps lists", () => {
      const input = "<ul><li>one</li><li>two</li></ul><ol><li>1</li></ol>";
      expect(sanitizeToString(input)).toBe(input);
    });

    test("keeps allowed attributes", () => {
      const input = '<img src="https://example.com/a.png" alt="pic" width="10" height="20" title="t" class="c">';
      const out = sanitizeToString(input);
      expect(out).toContain('src="https://example.com/a.png"');
      expect(out).toContain('alt="pic"');
      expect(out).toContain('width="10"');
      expect(out).toContain('height="20"');
      expect(out).toContain('title="t"');
      expect(out).toContain('class="c"');
    });

    test("keeps plain text and unicode", () => {
      expect(sanitizeToString("漢字 (kanji) &amp; emoji 🦙")).toBe("漢字 (kanji) &amp; emoji 🦙");
    });
  });

  describe("disallowed elements", () => {
    test("unwraps unknown tags but keeps their content", () => {
      expect(sanitizeToString("<font color=\"red\">text</font>")).toBe("text");
      expect(sanitizeToString("<marquee>zoom</marquee>")).toBe("zoom");
      expect(sanitizeToString("<article><p>hi</p></article>")).toBe("<p>hi</p>");
    });

    test("removes script tags with their content", () => {
      expect(sanitizeToString('<p>hi</p><script>alert(1)</script>')).toBe("<p>hi</p>");
    });

    test("removes style tags with their content", () => {
      expect(sanitizeToString("<style>p{color:red}</style><p>hi</p>")).toBe("<p>hi</p>");
    });

    test("removes iframe/object/embed with content", () => {
      expect(sanitizeToString('<iframe src="https://evil.example"></iframe>ok')).toBe("ok");
      expect(sanitizeToString('<object data="x">fallback</object>ok')).toBe("ok");
      expect(sanitizeToString('<embed src="x">ok')).toBe("ok");
    });

    test("removes nested disallowed tags inside allowed ones", () => {
      expect(sanitizeToString("<p>a<script>bad()</script>b</p>")).toBe("<p>ab</p>");
    });

    test("unwraps deeply nested disallowed tags, keeping allowed descendants", () => {
      expect(sanitizeToString("<section><div><nav><b>keep</b></nav></div></section>"))
        .toBe("<div><b>keep</b></div>");
    });

    test("removes HTML comments", () => {
      expect(sanitizeToString("<p>a</p><!-- secret -->")).toBe("<p>a</p>");
    });
  });

  describe("attribute filtering", () => {
    test("strips event handler attributes", () => {
      expect(sanitizeToString('<p onclick="alert(1)" onmouseover="x()">hi</p>')).toBe("<p>hi</p>");
      expect(sanitizeToString('<img src="https://x.example/a.png" onerror="alert(1)">'))
        .toBe('<img src="https://x.example/a.png">');
    });

    test("strips style and id attributes", () => {
      expect(sanitizeToString('<p style="color:red" id="x">hi</p>')).toBe("<p>hi</p>");
    });

    test("strips data-* attributes", () => {
      expect(sanitizeToString('<p data-evil="1">hi</p>')).toBe("<p>hi</p>");
    });
  });

  describe("URL scheme filtering", () => {
    test("keeps https and http hrefs", () => {
      expect(sanitizeToString('<a href="https://example.com">x</a>'))
        .toBe('<a href="https://example.com">x</a>');
      expect(sanitizeToString('<a href="http://example.com">x</a>'))
        .toBe('<a href="http://example.com">x</a>');
    });

    test("keeps relative hrefs (resolve to AO3)", () => {
      expect(sanitizeToString('<a href="/works/12345">x</a>'))
        .toBe('<a href="/works/12345">x</a>');
    });

    test("drops javascript: hrefs", () => {
      expect(sanitizeToString('<a href="javascript:alert(1)">x</a>')).toBe("<a>x</a>");
    });

    test("drops javascript: hrefs with mixed case and whitespace", () => {
      expect(sanitizeToString('<a href="  JaVaScRiPt:alert(1)">x</a>')).toBe("<a>x</a>");
      expect(sanitizeToString('<a href="java\tscript:alert(1)">x</a>')).toBe("<a>x</a>");
    });

    test("drops data: image sources", () => {
      expect(sanitizeToString('<img src="data:image/svg+xml,<svg onload=alert(1)>">')).toBe("<img>");
    });

    test("drops other dangerous schemes", () => {
      expect(sanitizeToString('<a href="vbscript:x">x</a>')).toBe("<a>x</a>");
      expect(sanitizeToString('<a href="file:///etc/passwd">x</a>')).toBe("<a>x</a>");
      expect(sanitizeToString('<a href="ftp://x.example">x</a>')).toBe("<a>x</a>");
    });
  });

  describe("robustness", () => {
    test("handles empty and non-string input", () => {
      expect(sanitizeToString("")).toBe("");
      expect(sanitizeToString(null)).toBe("null");
      expect(sanitizeToString(undefined)).toBe("undefined");
    });

    test("handles malformed HTML without throwing", () => {
      expect(() => sanitizeToString("<p><b>unclosed")).not.toThrow();
      expect(() => sanitizeToString("<<>><p att=<>>x</p>")).not.toThrow();
    });

    test("is idempotent", () => {
      const messy = '<div onclick="x()"><script>bad()</script><a href="javascript:y">link</a><font>text</font></div>';
      const once = sanitizeToString(messy);
      expect(sanitizeToString(once)).toBe(once);
    });

    test("survives the testcomment.html fixture, keeping AO3 tags", () => {
      const fixture = fs.readFileSync(
        path.join(__dirname, "..", "content", "testcomment.html"),
        "utf-8"
      );
      const out = sanitizeToString(fixture);
      for (const tag of ["h1","h2","h3","h4","h5","h6","strong","em","u","s","strike","del","ins","big","small","tt","sup","blockquote","pre","ul","ol","li","a"]) {
        expect(out).toContain(`<${tag}`);
      }
      expect(out).toContain("漢字");
    });
  });
});

describe("sanitizeToFragment", () => {
  test("returns a DocumentFragment owned by the page document", () => {
    const frag = sanitizeToFragment("<p>hi</p>");
    expect(frag).toBeInstanceOf(DocumentFragment);
    expect(frag.ownerDocument).toBe(document);
    expect(frag.firstChild.tagName).toBe("P");
  });

  test("fragment contains no disallowed nodes", () => {
    const frag = sanitizeToFragment('<script>x()</script><p onclick="y()">ok</p><!-- c -->');
    const div = document.createElement("div");
    div.append(frag);
    expect(div.querySelector("script")).toBeNull();
    expect(div.querySelector("[onclick]")).toBeNull();
    expect(div.innerHTML).toBe("<p>ok</p>");
  });
});
