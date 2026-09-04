# Chrome & Navigation Architecture

This template is a **pure HTML + Tailwind v4** gallery. To keep 74 pages
maintainable, the shared "chrome" (head, sidebar shell, nav, user menu) is
**single-source** and injected at build time by a Vite plugin. Source pages
are content-only; `dist/` is fully static, standalone HTML.

## How it works

Source pages carry HTML-comment markers that the plugin replaces:

```html
<!doctype html>
<html lang="en">
    <!-- @chrome:head title="Analytics Dashboard — Admin Panel" favicon="🖥️" -->
    <!-- @chrome:sidebar-open variant="dark" -->
    <!-- brand block (page-specific content) -->
    <!-- @chrome:sidebar-nav variant="dark" user-avatar="..." user-name="..." user-email="..." user-signedin="..." -->
    <!-- page's own <header> + <main> content -->
    <!-- @chrome:close -->
</html>
```

The plugin (`plugins/vite-chrome-inject.js`) expands these into the full
head, sidebar shell, nav (from `src/chrome/nav.json`), user menu, and closing
tags. It runs `enforce: 'pre'` so Tailwind still scans the injected classes.

## What is single-source vs page content

| Single-source (edit once) | Page content (stays inline) |
| --------------------------- | ------------------------------ |
| `<head>` (theme bootstrap, fonts, css link) — `src/chrome/head.html` | `<title>` + favicon (via marker attrs) |
| Sidebar shell (aside, overlay, flex wrappers) — plugin `SHELL` data | Brand block (logo, name, accent color) |
| Nav (sections, icons, counts, active state) — `src/chrome/nav.json` | `<header>`/topbar (title bar, search, menus) |
| User menu (dropdown, links) — plugin `SHELL` data | User avatar / name / email / signed-in line (via marker attrs) |

## Adding a page

1. Create `pages/<section>/my-page.html` with the markers above and your
   `<header>` + `<main>` content.
2. Add an entry to `src/chrome/nav.json` under the right section
   (`{ "label": "...", "href": "/pages/<section>/my-page.html" }`).
3. Run `npm run build` (or `npm run dev`).

## Reordering / renaming sections

Edit `src/chrome/nav.json` only — the sidebar order, labels, icons, and
counts all derive from it. No page files change.

## Changing the sidebar shell / user menu

Edit the `SHELL` object in `plugins/vite-chrome-inject.js` (open/nav/user
markup per variant: dark, light, collapsible). The nav itself is generated
from `nav.json`.

## Changing the head

Edit `src/chrome/head.html`. `{{TITLE}}` and `{{FAVICON}}` are substituted
from the page's `@chrome:head` marker.

## Verification

`npm run build:dist` builds and runs `scripts/verify-dist.js`, which checks
the output is standalone (no leaked markers, relative assets, sidebar
structure intact, Tailwind chrome classes present).

## Retired scripts

The old Python generators (`scripts/_deprecated/build_sidebar_dropdowns.py`,
`make_user_menu_dropdown.py`) are superseded by the plugin + `nav.json`.
`scripts/migrate-to-chrome.js` was a one-shot migration and is kept for
reference only.
