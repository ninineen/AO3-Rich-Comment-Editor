// Keeps dev-only files out of the packaged XPI. The shipped add-on should
// contain only: manifest.json, content/ (js + css), vendor/squire.js, icons/.
export default {
  ignoreFiles: [
    ".git/**",
    ".gitignore",
    ".web-ext-config.mjs",
    "package.json",
    "package-lock.json",
    "amo-metadata.json",
    "node_modules/**",
    "web-ext-artifacts/**",
    "tests",
    "tests/**",
    "jest.config.js",
    "README.md",
    "CHANGELOG.md",
    "REVIEWER_NOTES.md",
    "RELEASING.md",
    "vendor/squire-no-innerhtml.patch",
    "**/*.tmp.*",
  ],
};
