# Notes to Reviewer

The `UNSAFE_VAR_ASSIGNMENT` warnings in `vendor/trix.js` and `vendor/purify.min.js` are from third-party vendored libraries (Trix 2.1.19 and DOMPurify 3.1.6). These are unmodified upstream releases and the innerHTML usage is internal to those libraries.
