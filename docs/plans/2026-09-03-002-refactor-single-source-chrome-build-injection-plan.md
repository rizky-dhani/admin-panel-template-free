---
title: "Refactor: single-source chrome with build-time injection (Vite plugin + partials + nav data)"
type: refactor
status: active
date: 2026-09-03
---

# Refactor: single-source chrome with build-time injection (Vite plugin + partials + nav data)

## Overview

Convert the 74-page pure-HTML gallery from copy-pasted chrome (head + theme bootstrap + sidebar + topbar) into a **single-source, build-injected** source tree, while preserving the **static, standalone `dist/` HTML** that is the monetizable product. A small Vite `transformIndexHtml` plugin injects shared partials and a `nav.json` data file at dev and build time. Source pages shrink to content-only; `dist/` stays copy-pasteable and file-openable for buyers. The two ad-hoc Python rewrite scripts are retired.

## Problem Frame

The template is 74 HTML files / ~111k lines / ~5.7 MB. 66 pages share an identical sidebar shell; all 74 duplicate the `<head>` theme-bootstrap block and Google Fonts links. Recent commits are all 66-file rewrites (dark-mode badge, dropdown nav, user-menu). Two checked-in Python scripts (`scripts/build_sidebar_dropdowns.py`, `scripts/make_user_menu_dropdown.py`) exist solely to brute-force chrome edits — evidence the current model does not scale for a paid product that needs updates, new sections, and multi-layout variants.

For monetization the deliverable must remain **static HTML that buyers can open and edit without a build step**. Framework-izing (Option B) would abandon the niche; keeping copy-paste source (today) blocks maintainability. This plan (Option A) makes chrome single-source for the maintainer while keeping `dist/` as the standalone product.

## Requirements Trace

### Chrome Maintainability (R1, R4)

- R1. A chrome change (nav reorder, sidebar variant tweak, brand block, topbar control, theme bootstrap) is a single-file edit, not a 66-file batch.
- R4. Navigation (sections, order, counts, active/expanded state per page) is driven by one data file; adding a section or page does not require hand-editing 66 files.

### Distributable Product (R2, R5)

- R2. `dist/` remains static, standalone HTML — each file opens correctly via `file://` or any static host, with no build tool required by the buyer. Copy-paste of a page's `dist` markup still works.
- R5. The product can ship multi-layout variants (dark sidebar / light sidebar / collapsible / topnav) from the same content without duplicating content pages. Dark/light land in this refactor; collapsible and topnav shells land as separate partials with the same plugin (see U1/U2).

### Dev & Contributor Experience (R3, R7)

- R3. Dev experience stays `npm run dev` / `npm run build` / `npm run preview` with no new runtime dependency for buyers.
- R7. Ad-hoc Python generators are retired; the new workflow is documented so a new contributor can add a page in one place.

### Quality Gate (R6)

- R6. No visual or behavioral regression: existing pages render identically before and after (spot-checked), and all `data-*` interactivity in `src/js/app.js` keeps working.

## Scope Boundaries

- Stays pure HTML + Tailwind v4 + Vite + `src/js/app.js` data-attribute pattern — no React/Vue/11ty introduction, no per-page JS.
- Covers chrome extraction (head, theme bootstrap, sidebar variants, topbar, closing wrappers + script tag) and nav data. Content pages keep their own markup; no redesign of dashboards/tables/forms.
- `index.html` gallery shell is also de-duplicated but may keep its distinct layout; not forced into the sidebar shell.
- Auth pages (centered/split/modern) and error pages (no sidebar) stay minimal — they share `head` but not the sidebar shell.

### Deferred to Follow-Up Work

- Relative vs absolute asset path audit for every marketplace's zip layout — verification script in U4 covers the default; marketplace-specific zips in a follow-up.
- Automated visual regression (screenshot diff) pipeline — U4 adds a lightweight DOM/grep verifier; pixel diff can follow.
- Pricing/packaging, license file, changelog, and marketplace listing copy — outside this refactor; tracked separately.

## Context & Research

### Relevant Code and Patterns

- `vite.config.js` — multi-page glob (`**/*.html` → `rollupOptions.input`), `@tailwindcss/vite` plugin. The injection plugin hooks here (`transformIndexHtml` or `enforce: pre`).
- `src/js/app.js` (261 lines) — all interactivity via `data-*` attributes (`data-theme-toggle`, `data-dropdown`, `data-collapse`, `data-tab`, `data-toggle`, `data-billing-toggle`, `data-table-search`, `data-page-group`). No per-page JS. Must keep working unchanged.
- `src/css/app.css` (666 lines) — shared; untouched except to confirm no chrome-specific coupling.
- `pages/**/*.html` — 74 files; `grep -l 'id="sidebar"'` = 66; `prefers-color-scheme` bootstrap in all 74; typical sidebar page 1,400–1,930 lines, auth/error 109–233 lines. Chrome is 60–75% of each sidebar page.
- `scripts/build_sidebar_dropdowns.py` (317 lines), `scripts/make_user_menu_dropdown.py` (215 lines) — current chrome generators; define the nav section map that becomes `nav.json`.
- `index.html` (1,930 lines) — gallery entry; uses same head but distinct body structure.

### Institutional Learnings

- No `docs/solutions/` entries to carry forward (directory absent). The two Python scripts are the institutional knowledge for nav structure.

### External References

- Vite `transformIndexHtml` hook — canonical place for HTML partial injection without extra dependencies. Keeps the buyer contract (static output) intact.
- Existing pattern to preserve: keep `dist/` HTML valid and self-contained; do not switch to client-side includes (would break `file://` and copy-paste).

## Key Technical Decisions

- **Decision: Vite `transformIndexHtml` plugin over 11ty/templating engine.** Rationale: stays inside the existing Vite + Tailwind toolchain, zero new runtime, no buyer-facing change, minimal migration risk. An SSG would add a second build system and change authoring semantics.
- **Decision: HTML-comment markers (`<!-- @chrome:head title="..." variant="dark" -->`) over frontmatter.** Rationale: markers keep source files valid HTML (editor preview still works), are grep-able, and map cleanly to `transformIndexHtml` string replacement. Frontmatter would require a parser and break plain-HTML preview.
- **Decision: `src/chrome/nav.json` as the single nav source.** Rationale: the Python scripts already encode a `section -> label` map; formalizing it as JSON removes the need for regex rewrites and enables deterministic active/expanded rendering per page (derived from file path). (`nav.js` was considered and rejected — JSON keeps the file toolable and diffable without code.)
- **Decision: The sidebar brand block is page-specific content, not shared chrome** (verified: 12 distinct brand signatures — "Acme Admin" indigo, "Dense Data" slate, "Shopy" emerald, "Minimal" gray, teal/red/amber/rose accents). Single-source chrome must NOT hardcode one brand. The sidebar partial is split: `sidebar-<variant>-open.html` provides `<body>` + flex + `<aside>` open (ends right after the brand slot), and the page carries its own brand block inline, then `sidebar-<variant>-nav.html` provides the nav + user menu + `</aside>` + overlay + flex-col open. This keeps the brand as page content while still single-sourcing the nav, user menu, and wrappers.
- **Decision: The topbar/header is NOT shared chrome** (verified: 63 distinct `<header>` variants across 67 sidebar pages — page-title vs search field, bell/profile menus, extra buttons, 82–218 lines each). It stays with each page's content; no `topbar.html` partial. Only the `<head>`, sidebar shell, and wrappers are shared.
- **Decision: Source pages are standalone-valid HTML** — each ends with its own `</html>` after the `<!-- @chrome:close -->` marker, and the plugin's close replacement emits `<body>`-close + app.js only (not `</html>`). This keeps source previewable and linter-clean while dist/ stays correct.
- **Decision: Source pages become content-only with markers; migration via a one-shot Node script (not Python).** Rationale: Node can reuse the same nav data and run inside the repo without Python env; the script preserves content regions verbatim and is deleted after migration, avoiding a permanent generator to maintain.
- **Decision: Build-only relative `base` for distributable `dist` (`base: command === 'build' ? './' : '/'`).** Rationale: buyers opening `dist/pages/...html` via `file://` or from a subpath need relative asset links; the Vite dev server needs absolute `/src/...` for HMR. Scoping `base` to the build command keeps both working. Vite config becomes a function form `export default defineConfig(({ command }) => ({ base: command === 'build' ? './' : '/', ... }))`. Partials keep absolute `/src/...` links and let Vite rewrite them at build time.

## Open Questions

### Resolved During Planning

- Q: Will buyers need Node/Vite? A: No — `dist/` is prebuilt and self-contained; source build is maintainer-only.
- Q: How to keep source pages previewable before build? A: HTML-comment markers are ignored by browsers; partial injection only matters in Vite dev/build, so a raw file still shows content (without chrome) — acceptable for source preview.

### Deferred to Implementation

- Exact marker attribute names beyond the settled priority rule below — finalize when the plugin is stubbed and tested against 3 representative pages.
- Any page that does not fit the three shell types (sidebar / topnav / minimal) — handle as a one-off override after auditing pages/sections aggregators.

**Settled before implementation (reviewer-driven):**

- `base` is command-scoped (`command === 'build' ? './' : '/'`), `vite.config.js` is a function config, and partials keep absolute `/src/...` links for Vite to rewrite.
- Shell ownership: sidebar shells own `<div class="flex min-h-screen">` + `<aside>` + `{{NAV}}` + `</aside>` + `<div id="sidebar-overlay">` + `<div class="flex min-w-0 flex-1 flex-col">` open; `topbar.html` is the header only; a new `src/chrome/shell-close.html` (or inline footer partial) closes `</div></div></body>` and emits the `app.js` script tag. Topnav shell is a separate partial without sidebar/overlay. Auth/error use head marker only.
- Title/active priority: `title="..."` attribute if present wins, else infer from `nav.json` via file path, else fallback to filename. `activeSection` is inferred from `pages/<section>/...` and `pages/sections/<section>.html` (both map to that section); `index.html` and auth/errors get no active state; `active="..."` attribute is an explicit override only. Topnav's horizontal nav renders from the same `nav.json` but via its own shell.
- Tailwind ordering: chrome plugin uses `enforce: 'pre'` so partials exist on disk before `@tailwindcss/vite` scans; build verification asserts a class used only in `sidebar-dark.html` (e.g. `bg-gray-900`) exists in `dist/assets/*.css`.
- Migration parsing: use an HTML parser (`parse5` or `cheerio`), not string search; cut at the DOM path `body > div.flex > div.flex-col > main`, preserve wrapper attributes, dry-run to `.migrated/` and diff `textContent` before overwriting source.
- Watch/invalidation: plugin watches `src/chrome/**` via `configureServer` and triggers `server.ws.send({ type: 'full-reload' })` on change, or reads `nav.json` inside `transformIndexHtml` so Vite's watcher invalidates.

## Output Structure

```
src/chrome/
  head.html              # <head> with {{TITLE}} + theme bootstrap + fonts + css link
  sidebar-dark.html      # dark shell: body+bg + flex open + <aside> + {{NAV}} + </aside> + overlay + flex-col open
  sidebar-light.html     # light shell: same structure, light tokens + body bg-gray-50
  sidebar-collapsible.html  # collapsible variant: light aside (has #sidebar-collapse button in an inline header)
  nav.json               # ordered sections, labels, pages, counts — single source
plugins/
  vite-chrome-inject.js  # transformIndexHtml plugin (enforce:'pre', watches src/chrome/**)
scripts/
  migrate-to-chrome.js   # one-shot: strips chrome, inserts markers (then removed)
  verify-dist.js         # post-build checks: titles, sidebar id, no markers, asset links
```

Per-unit file lists remain authoritative; the tree above is the expected shape, not a constraint.

## Implementation Units

- [ ] U1. **Extract chrome partials and nav data**

  **Goal:** Create the canonical chrome sources so edits become single-file.

  **Requirements:** R1, R4, R5

  **Dependencies:** None

  **Files:**
  - Create: `src/chrome/head.html`, `src/chrome/sidebar-dark.html`, `src/chrome/sidebar-light.html`, `src/chrome/sidebar-collapsible.html`, `src/chrome/nav.json`
  - Modify: none yet (extraction only)
  - Test: `scripts/verify-dist.js` (scaffold, not yet enforced)

  **Approach:**
  - Copy the current `<head>` (through `</head>`) from a representative sidebar page into `head.html` with `{{TITLE}}` placeholder; keep the theme-bootstrap IIFE verbatim.
  - Sidebar partials own the outer wrappers: `<div class="flex min-h-screen">` + `<aside id="sidebar">` + `{{NAV}}` + `</aside>` + `<div id="sidebar-overlay">` + `<div class="flex min-w-0 flex-1 flex-col">` open. Keep class strings verbatim. Dark uses `bg-gray-100` body; light uses `bg-gray-50`. Collapsible is the light shell (its `#sidebar-collapse` button lives in the page's own inline header).
  - The `<header>` (topbar) is NOT extracted — it is page-specific content (title bar, search, bell/profile menus differ per page). It stays with each page's `<main>` content. This drops the original `topbar.html`/`shell-close.html` parts.
  - Derive `nav.json` from `scripts/build_sidebar_dropdowns.py`'s `SECTION_LABEL`/`SECTION_ICON`/`SUB_PAGES` maps, ported verbatim. Each entry: `{ key, label, icon, pages: [{ label, href }] }`.

  **Patterns to follow:**
  - Keep Tailwind class strings exactly as in source (no reformatting) to make diffs reviewable.
  - Preserve `data-*` attributes (`data-dropdown`, `data-collapse`, etc.) exactly — `src/js/app.js` depends on them.

  **Test scenarios:**
  - Happy path: `nav.json` contains every section present in `pages/` and every HTML file under that section appears once.
  - Edge case: section with a single page still renders a collapsible group with count=1.
  - Error path: `nav.json` with an unknown section key is ignored rather than crashing the plugin (warn and skip).

  **Verification:**
  - `src/chrome/*.html` partials exist and are valid HTML fragments; `nav.json` is valid JSON and covers all sections found on disk.

- [ ] U2. **Vite chrome-injection plugin (`transformIndexHtml`)**

  **Goal:** Wire dev and build so source pages with markers render full HTML, and `dist/` is standalone.

  **Requirements:** R2, R3, R4, R5, R6

  **Dependencies:** U1

  **Files:**
  - Create: `plugins/vite-chrome-inject.js`
  - Modify: `vite.config.js` (register plugin as `enforce: 'pre'`, make config a function `defineConfig(({ command }) => ({ base: command === 'build' ? './' : '/', ... }))`, and narrow `globSync` so `src/chrome/**` is not emitted as pages)
  - Test: `scripts/verify-dist.js` (first real assertions)

  **Approach:**
  - Plugin is `enforce: 'pre'` so partials are injected before `@tailwindcss/vite` scans. It watches `src/chrome/**` via `configureServer` and triggers a full reload on change (or reads `nav.json` inside `transformIndexHtml`).
  - On `transformIndexHtml` it:
    1. Replaces `<!-- @chrome:head title="..." -->` with `head.html` with `{{TITLE}}` substituted (priority: `title` attr > `nav.json` lookup by file path > filename fallback).
    2. Replaces `<!-- @chrome:sidebar variant="dark|light|collapsible" -->` with the matching sidebar partial where `{{NAV}}` is expanded to the full nav HTML for the current page (active section inferred from `pages/<section>/...` and `pages/sections/<section>.html`; `index.html` maps to dashboards; `active="..."` attr is an explicit override). Topnav, auth, error pages use head + close markers only (no sidebar shell).
    3. Replaces the closing `</main>...close sequence` via a `<!-- @chrome:close -->` marker that emits `</div></div>` + `<script src="/src/js/app.js">` + `</body></html>`.
  - Keep `rollupOptions.input` glob but ignore `src/chrome/**` and `plugins/**` (e.g. `globSync("**/*.html", { ignore: ["node_modules/**", "dist/**", "src/chrome/**"] })` or scope to `["index.html", "pages/**/*.html"]`). Partials keep absolute `/src/...` links for Vite to rewrite at build time.

  **Patterns to follow:**
  - `vite.config.js` existing `globSync` multi-page pattern.
  - Keep plugin dependency-free (Node `fs`/`path` only) so no new buyer dependency.

  **Test scenarios:**
  - Happy path: `npm run dev` serves a sidebar page with correct active section highlighted and collapsible groups working.
  - Happy path: `npm run build` emits `dist/pages/dashboards/analytics.html` containing a full `<head>` and `<aside id="sidebar">` with no `<!-- @chrome` markers left.
  - Edge case: a page outside `pages/<section>/` (e.g., `index.html`) gets the head partial but no sidebar injection.
  - Error path: missing partial file logs a clear error and fails the build (do not emit marker-leaking HTML).
  - Integration: `data-dropdown`/`data-collapse` in injected nav still work via `src/js/app.js` (manual click check on one page).

  **Verification:**
  - `npm run build` succeeds; `grep -r "@chrome" dist/` returns 0; one dark and one light page open in `vite preview` with correct active nav.

- [ ] U3. **Migrate pages to content-only (strip chrome, insert markers)**

  **Goal:** Convert the 66 sidebar pages + `index.html` + auth/error shells to use markers, shrinking source by ~60-70% and making chrome single-source.

  **Requirements:** R1, R2, R6

  **Dependencies:** U1, U2

  **Files:**
  - Create: `scripts/migrate-to-chrome.js` (one-shot, deleted after)
  - Modify: `pages/**/*.html` (66 sidebar pages), `index.html`, `pages/auth/*.html`, `pages/errors/*.html` (head-only)
  - Test: `scripts/verify-dist.js` (expanded)

  **Approach:**
  - Write a one-shot Node script using an HTML parser (`parse5` or `cheerio`) — not string search. For each sidebar page, extract the inner `<aside>` body only where needed and the `<main>` content, then rewrite to: `<!doctype html>` + `<!-- @chrome:head title="..." -->` + `<!-- @chrome:sidebar variant="..." -->` + the page's own `<header>` + `<main>...</main>` + `<!-- @chrome:close -->`. Preserve the `<header>` (it is page-specific content) and the `<main>` body verbatim. Keep originals as `.bak` until verified. Dry-run to `.migrated/` and diff `textContent` before overwriting.
  - Auth/error/topnav pages (no sidebar): rewrite to `<!doctype html>` + `<!-- @chrome:head title="..." -->` + `<body>` + page content + `<!-- @chrome:close -->` (close emits only `</body></html>`; these pages have their own wrapper handling).
  - Aggregator pages under `pages/sections/*.html` map to their section for active state (same as `pages/<section>/*.html`); `index.html` maps to `dashboards`.
  - Run `npm run build` and diff `dist/` against a pre-migration `dist.before/` snapshot (DOM-level: titles, sidebar presence, nav item counts).

  **Patterns to follow:**
  - Preserve content markup verbatim — no Tailwind reformatting, no attribute rewrapping.
  - Keep absolute source links (`/src/css/app.css`, `/src/js/app.js`) in partials so the plugin controls the final form.

  **Test scenarios:**
  - Happy path: after migration, `grep -c 'id="sidebar"' pages/**/*.html` drops from 66 to 0 in source (present only in partials), while `grep -c 'id="sidebar"' dist/**/*.html` stays 66.
  - Happy path: each migrated page's `<title>` in `dist/` matches its pre-migration title.
  - Edge case: a page that already had hand-edits to the sidebar (e.g., custom brand text) — migration warns and preserves the content but does not carry the custom chrome forward (chrome is now canonical).
  - Error path: running the migration twice is idempotent — second run detects existing markers and skips.
  - Integration: spot-check 3 pages (one dark, one light, one topnav) in `vite preview` — no visual delta vs pre-migration (manual or screenshot).

  **Verification:**
  - Source HTML line count drops significantly (expect ~60-70% reduction per sidebar page); `dist/` file count and byte size match pre-migration within noise; no `{{TITLE}}`/`{{NAV}}` leaks in `dist/`.

- [ ] U4. **Distributable build hardening and verification**

  **Goal:** Ensure the sold artifact (`dist/`) is truly standalone and shippable.

  **Requirements:** R2, R6

  **Dependencies:** U2, U3

  **Files:**
  - Modify: `vite.config.js` (confirm `base`, asset handling), `package.json` (optional `build:dist` script)
  - Create: `scripts/verify-dist.js` (final form), `.gitignore` (ensure `dist.before/` ignored if used)
  - Test: `scripts/verify-dist.js`

  **Approach:**
  - `base` is already command-scoped from U2; confirm `dist/**/*.html` contains no `href="/src` or `src="/src` (Vite rewrites to relative `assets/`). Check at every nesting depth (`pages/<section>/*.html` vs `index.html`) since relative `../` depth varies.
  - Handle Google Fonts: keep CDN links as-is (document that offline zip needs fonts bundled as a follow-up variant).
  - `verify-dist.js` checks: every `dist/**/*.html` has `<!doctype>`, exactly one `<title>`, no `<!-- @chrome` markers, no `{{` leaks, sidebar id present where expected, `app.js`/`app.css` links resolve to existing files in `dist/assets/`, a class used only in `sidebar-dark.html` (e.g. `bg-gray-900`) exists in `dist/assets/*.css`, and nav item count matches `nav.json` totals plus `data-collapse` targets still toggle.

  **Patterns to follow:**
  - Keep `npm run build` as the single buyer-build command; do not add required env vars.

  **Test scenarios:**
  - Happy path: `npm run build && node scripts/verify-dist.js` exits 0.
  - Edge case: `dist/` opened via `file://` (or `npx serve dist`) — one dark and one light page load with correct styles and no 404s for css/js.
  - Error path: a page with a broken marker (e.g., `variant="unknown"`) fails `verify-dist.js` with a clear message.

  **Verification:**
  - `verify-dist.js` passes in CI/local; manual open of 2–3 `dist` pages via `file://` shows correct rendering.

- [ ] U5. **Retire Python scripts, document the new workflow, add guardrail**

  **Goal:** Make the new single-source workflow the obvious, documented way to add sections/pages, and prevent regression to 66-file edits.

  **Requirements:** R1, R4, R7

  **Dependencies:** U1–U4

  **Files:**
  - Modify: `README.md` (Quick start + "Add a page / Add a section" guide), `AGENTS.md` if present
  - Create: `docs/CHROME.md` (or section in README) — chrome architecture, partial locations, nav.json schema
  - Delete or deprecate: `scripts/build_sidebar_dropdowns.py`, `scripts/make_user_menu_dropdown.py` (remove or move to `scripts/_deprecated/`)
  - Deferred: `.github/workflows/verify.yml` — CI guard for leaked chrome is follow-up; this plan ships local `verify-dist.js` only

  **Approach:**
  - Document: "To add a page: create `pages/<section>/my-page.html` with head/sidebar/topbar markers and your `<main>` content; add an entry to `src/chrome/nav.json`; run `npm run build`."
  - Document: "To reorder sections or rename a label: edit `src/chrome/nav.json` only."
  - Add a lightweight local guard: `verify-dist.js` fails if `pages/**/*.html` still contains `id="sidebar"` or `prefers-color-scheme` outside `src/chrome/` (leaked chrome). CI wiring (`.github/workflows/verify.yml` / pre-commit hook) is deferred to follow-up — this plan ships `verify-dist.js` + README only.

  **Patterns to follow:**
  - README style already in repo (Quick start, Pages included, Tech bullets) — extend, don't rewrite.

  **Test scenarios:**
  - Happy path: a new contributor following the README can add a dummy page and see it in nav after `npm run build` without touching other files.
  - Edge case: `nav.json` reordering changes sidebar order in `dist` without touching any `pages/` file.
  - Error path: a page that accidentally reintroduces a full `<aside id="sidebar">` is caught by the guard script.

  **Verification:**
  - README contains the new sections; Python scripts are gone or clearly deprecated; `verify-dist.js` guard catches leaked chrome.

## System-Wide Impact

- **Interaction graph:** Vite dev server and build pipeline now depend on `src/chrome/*` and `plugins/vite-chrome-inject.js`. `src/js/app.js` is unaffected but its selectors (`[data-dropdown]`, `[data-collapse]`, etc.) now match injected nav markup — verify after injection.
- **Error propagation:** Missing partial or malformed marker fails the build (do not emit half-injected HTML). `nav.json` parse errors surface at plugin startup.
- **State lifecycle risks:** No persistent state; `localStorage` theme toggle in `head.html` IIFE is preserved verbatim.
- **API surface parity:** `dist/` HTML is the public API (buyers depend on it). No change to `dist` shape — only how it's produced.
- **Integration coverage:** `transformIndexHtml` ordering vs `@tailwindcss/vite` — confirm the chrome plugin runs in the correct order so Tailwind still processes the final HTML.
- **Unchanged invariants:** Tailwind v4, Vite multi-page glob, `src/js/app.js` data-attribute contract, and the set of `pages/**/*.html` URLs all stay.

## Risks & Dependencies

| Risk | Mitigation |
| ------ | ------------ |
| Marker injection breaks Tailwind content scanning (classes in partials not detected) | Keep partials under `src/chrome/` so the scan covers them; `verify-dist.js` asserts a class used only in `sidebar-dark.html` (e.g. `bg-gray-900`) exists in `dist/assets/*.css`. Plugin is `enforce: 'pre'` so injection happens before `@tailwindcss/vite` scans. |
| `base: './'` breaks dev HMR if applied globally | Config is a function `defineConfig(({ command }) => ({ base: command === 'build' ? './' : '/', ... }))`; partials keep absolute `/src/...` links and Vite rewrites them to relative `assets/` at build time. `verify-dist.js` checks `dist/**/*.html` contains no `href="/src` / `src="/src` at any nesting depth. |
| Migration script mangles a content page (no sentinel today) | Use an HTML parser (`parse5`/`cheerio`), cut at `body > div.flex > div.flex-col > main`, dry-run to `.migrated/` and diff `textContent` before overwriting; keep `.bak` until `verify-dist.js` + spot-checks pass; migration is idempotent. |
| Nav active-state inference wrong for `index.html` / `pages/sections/*.html` / topnav | Inferred from `pages/<section>/...` and `pages/sections/<section>.html` (both map to that section); `index.html` and auth/errors get no active state; `active="..."` attr is an explicit override only; topnav uses its own shell rendering the same `nav.json` horizontally. |
| `src/chrome/**` partials emitted as pages by `globSync("**/*.html")` | Narrow the glob to `["index.html", "pages/**/*.html"]` or add `src/chrome/**` to `ignore`; verify `vite build` input keys no longer include `src/chrome`. |
| Chrome edits not reflected without restart | Plugin watches `src/chrome/**` via `configureServer` and triggers `server.ws.send({ type: 'full-reload' })`, or reads `nav.json` inside `transformIndexHtml` so Vite's watcher invalidates. |

## Documentation / Operational Notes

- Update `README.md`: Quick start stays, add "Chrome & Navigation" and "Add a page" subsections.
- Add `docs/CHROME.md` if the README section grows too long.
- No new runtime dependency; Node 18+ and existing `vite`/`tailwindcss` suffice.
- Rollout: land U1–U2 on a branch, run U3 migration, verify `dist/` diff, then merge. Keep the migration script's `.bak` files until review is done.

## Sources & References

- Origin: monetization discussion — Option A (single-source chrome, static `dist`) chosen over B (frameworkize) and C (generator-only).
- Related code: `vite.config.js`, `src/js/app.js`, `src/css/app.css`, `pages/**/*.html` (74 files), `index.html`, `scripts/build_sidebar_dropdowns.py`, `scripts/make_user_menu_dropdown.py`
- Vite docs: `transformIndexHtml` hook, `base` config, `rollupOptions.input` multi-page.
