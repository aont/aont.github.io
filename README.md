# A Collection of Web Tools

This repository contains a small collection of bookmarklets and helper pages for quickly suspending and manipulating web pages.

## Contents

- **public/** – Static pages that receive state from the bookmarklets.
  - `suspend.html` displays a large link back to the original page when opened with query parameters.
  - `clipboard-format.html`, `clipboard-manipulator.html`, `chatgpt-bookmarklet.html`, `html-editor.html`, `open-blank.html`, and `suspend-manual.html` provide additional clipboard utilities and helper pages.
- **bookmarklet/** – Bookmarklet source and minified builds. `kill.js` redirects the browser to the hosted `suspend.html` page while preserving the current tab's title, URL, and favicons.

## Usage

1. Host the contents of the `public/` directory (for example with GitHub Pages).
2. Create a bookmark whose URL is the contents of `bookmarklet/kill.js`.
3. When the bookmarklet is activated, the current page is "suspended"—the browser navigates to the hosted `suspend.html` page, which then renders a link back to the original location and restores the favicons.

## Development

No build step is required. Update the files directly and host them from a static file server. The minified JavaScript in `bookmarklet/kill.min.js` should be regenerated if `kill.js` changes.
