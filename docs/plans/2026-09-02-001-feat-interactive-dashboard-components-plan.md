---
title: Make all dashboard demo components interactive
type: feat
status: active
date: 2026-09-02
---

# Make all dashboard demo components interactive

## Overview

The admin panel template is a pure HTML + Tailwind CSS v4 gallery of 55 pages. Every page renders interactive-looking components — toggle switches, pricing billing toggles, tabs, collapsible nav groups, dropdown menus, table search/filter, toast dismiss buttons, and pagination — but **none of them actually work**. They are static markup. The single shared `src/js/app.js` already contains handlers for dropdowns (`data-dropdown`) and tabs (`data-tab`), but **no page uses those attributes**, so those handlers are dead code.

This plan makes every demo component genuinely interactive by extending the shared `app.js` with generic, data-attribute-driven handlers and adding the corresponding attributes to the existing markup. No framework, no per-page scripts — one shared script, declarative wiring.

## Problem Frame

A template gallery's value is that buyers can *try* the components. Today a visitor clicking a toggle, a tab, or a pricing switch sees nothing happen, which reads as broken. The fix is to wire the existing static components to behavior using the project's established single-`app.js` pattern.

**Current state (verified):**

- 49 of 55 pages load `src/js/app.js`; the 6 that don't are the standalone error pages (404/403/500) and auth pages that use their own centered layout.
- `app.js` has working sidebar toggle/collapse, plus **dead** dropdown and tab handlers (no markup uses `data-dropdown`/`data-tab`).
- Interactive components that are static today: 7 toggle switches, 1 pricing monthly/yearly switch, 16 native `<select>`s, 2 table search inputs, 2 filter buttons, 1 tab group (user-profile), 2 collapsible nav groups (sidebar-navigation), ~8 toast close buttons, topbar bell/profile menus, and pagination controls.

## Requirements Trace

- R1. Toggle switches (on/off) visually flip state when clicked, across all pages that render them.
- R2. The pricing monthly/yearly switch swaps displayed prices and the `/mo` vs `/yr` suffix.
- R3. Tab groups switch visible panels and active-tab styling.
- R4. Collapsible nav groups expand/collapse their sub-links.
- R5. Topbar bell and profile menus open/close as dropdowns.
- R6. Table search inputs filter table rows by text; filter buttons toggle a filter state.
- R7. Toast dismiss buttons remove the toast from view.
- R8. Pagination controls navigate between page states (active page highlight).
- R9. All behavior is driven by the shared `src/js/app.js` via data attributes — no per-page inline scripts.

## Scope Boundaries

- **No framework** — stays pure HTML + Tailwind + vanilla JS. No React/Vue/Alpine.
- **No persistence** — state is in-memory/DOM only; page reload resets it (appropriate for a demo template).
- **No real data** — search filters the static demo rows already present; it does not fetch anything.
- **No form submission** — submit buttons remain non-functional (they are demo affordances); only the interactive *components* (toggles, tabs, dropdowns, etc.) are wired.
- **No new pages** — only existing pages get markup attributes added.
- **No changes to the 6 standalone error/auth pages** unless they contain a component in scope (they do not).

### Deferred to Follow-Up Work

- Custom-styled (non-native) `<select>` dropdowns: native selects already work in the browser; restyling them is a separate visual task, not an interactivity fix.
- Drag-and-drop, charts animation, or any behavior requiring a library.

---

## Context & Research

### Relevant Code and Patterns

- `src/js/app.js` — the single shared script. Already has the sidebar toggle/collapse pattern and dead dropdown/tab handlers to extend. The existing dropdown handler is the model for the new generic handlers.
- `src/css/app.css` — Tailwind v4 `@theme` tokens plus the `.collapsed` sidebar rules added earlier. New component-state CSS (e.g., a `.hidden` toggle for panels) should follow this file's plain-CSS-after-`@theme` convention.
- Toggle switch markup pattern (repeated): `<button class="relative h-6 w-11 rounded-full bg-gray-200 transition"><span class="absolute left-1 top-1 h-4 w-4 rounded-full bg-white"></span></button>` — the "on" state uses `bg-indigo-600`/`bg-amber-500` and `right-1`/`right-0.5` knob position.
- Pricing toggle markup: `pages/pricing/pricing-toggle.html` — a switch between "Monthly"/"Yearly" labels with per-plan `<span class="text-3xl font-bold">$9</span>` + `/mo` suffix + `or $86/year` line.
- Tab markup: `pages/users/user-profile.html` — `border-b-2 border-indigo-600` active vs `border-transparent` inactive buttons, with content panels below.
- Collapsible nav markup: `pages/navigation/sidebar-navigation.html` — a header `<button>` with a chevron `<svg>` and a sibling `<div class="mt-1 space-y-1 pl-4">` of links.
- Table search markup: `pages/tables/table-dense.html` and `pages/users/user-list.html` — a search `<input>` above a `<table>`.
- Toast dismiss markup: `pages/toasts/toast-notifications.html` — a close `<button class="text-gray-400 hover:text-gray-600">` inside each toast card.
- Topbar menus: `pages/layouts/sidebar-light.html`, `topnav.html`, and the dashboard pages — a bell `<button>` and a profile avatar block in the topbar.

### Institutional Learnings

- None in `docs/solutions/` (directory does not exist yet). This is a greenfield interactivity layer.

### External References

- None required — the work is self-contained vanilla DOM behavior following the project's existing `app.js` pattern.

---

## Key Technical Decisions

- **One shared script, declarative data attributes:** Extend `src/js/app.js` with generic handlers keyed off data attributes (`data-toggle`, `data-billing-toggle`, `data-tab`, `data-collapse`, `data-dropdown`, `data-table-search`, `data-dismiss`, `data-page`). Pages opt in by adding attributes to existing markup. This matches the project's single-script convention and keeps every page consistent.
- **Event delegation where possible:** Use a single delegated `document` click listener for toggle/dropdown/dismiss/pagination so new markup needs no per-element listener registration. Tabs and collapse need per-group scoping, handled by walking up to a `[data-tab-group]` / `[data-collapse-group]` container.
- **State via classes, not inline styles:** Toggles flip `bg-*`/knob-position classes; panels toggle a `.hidden` class; active tabs swap border/text classes. This keeps behavior in CSS classes the template already uses.
- **Pricing swap via `data-` price pairs:** Each plan's price element carries `data-monthly` and `data-yearly` values plus a `data-suffix`; the toggle reads them and swaps text. Avoids hardcoding per-plan JS.
- **Search filters rows by text content:** The search input filters `<tbody>` rows whose text matches (case-insensitive), hiding non-matches with `.hidden`. No data model needed.

---

## Open Questions

### Resolved During Planning

- **Should selects be custom-styled?** No — native selects already function; restyling is a separate visual task, deferred.
- **Should the 6 standalone error/auth pages be touched?** No — they contain no in-scope interactive components.

### Deferred to Implementation

- **Exact class names for toggle "on" state** across pages (some use `bg-indigo-600`, some `bg-amber-500`): the handler should preserve each page's existing "on" color by reading it from a `data-on` attribute or a default, decided while editing each page.
- **Whether the topnav profile menu should be a dropdown or a simple toggle:** resolved by matching the existing (dead) `data-dropdown` handler contract.

---

## Implementation Units

- [ ] U1. **Extend `src/js/app.js` with generic component handlers**

**Goal:** Add working, generic, data-attribute-driven handlers for toggle switches, pricing billing toggle, tabs, collapsible groups, dropdowns, table search, toast dismiss, and pagination — all in the shared script.

**Requirements:** R1, R2, R3, R4, R5, R6, R7, R8, R9

**Dependencies:** None

**Files:**

- Modify: `src/js/app.js`

**Approach:**

- Keep the existing sidebar toggle/collapse code intact.
- Replace the dead dropdown/tab handlers with working versions, and add the new handlers. Use a delegated click listener for toggle/dropdown/dismiss/pagination; scope tabs and collapse to their group container.
- Toggle switch: on click, flip the button between "on" (colored bg + knob right) and "off" (gray bg + knob left) by toggling a small set of classes; read the "on" color from `data-on` (default `bg-indigo-600`).
- Pricing toggle: on click, for each price element in the group, swap `data-monthly`/`data-yearly` text and the `/mo` vs `/yr` suffix; toggle the switch knob.
- Tabs: on click, set active border/text classes on the clicked tab, clear others in the group, and show the matching `[data-tab-panel]` while hiding siblings.
- Collapse: on click of a group header, toggle `.hidden` on the sibling links container and rotate the chevron.
- Dropdown: on click of a `[data-dropdown]` trigger, toggle `.hidden` on the target; close on outside click (already present).
- Table search: on `input`, filter `<tbody>` rows by text content, hiding non-matches.
- Toast dismiss: on click of a `[data-dismiss]` button, hide its closest toast card.
- Pagination: on click of a `[data-page]` button, set it active and clear siblings.

**Patterns to follow:**

- The existing sidebar toggle/collapse handlers in `src/js/app.js` (guard with `if (el)` before attaching).
- The existing (dead) dropdown handler's `data-dropdown` → `getElementById` contract.

**Test scenarios:**

- Happy path: clicking a toggle switch flips it on (colored bg, knob right) and clicking again flips it off.
- Happy path: clicking a tab shows its panel and highlights it; clicking another tab switches.
- Happy path: clicking a collapse header hides/shows the sub-links and rotates the chevron.
- Happy path: clicking a `[data-dismiss]` button hides its toast.
- Edge case: a page with no `[data-toggle]` elements — the delegated listener must not throw.
- Edge case: clicking outside a dropdown closes it (existing behavior preserved).
- Integration: the pricing toggle updates all three plan prices and suffixes in one click.

**Verification:**

- `src/js/app.js` contains working handlers for all eight component types, guarded so pages without those elements are unaffected. No console errors on any page.

---

- [ ] U2. **Wire toggle switches across pages**

**Goal:** Add `data-toggle` (and `data-on` where the "on" color differs) to every static toggle switch so they flip on click.

**Requirements:** R1

**Dependencies:** U1

**Files:**

- Modify: `pages/profile/settings.html` (3 switches)
- Modify: `pages/forms/form-advanced.html` (2 switches)
- Modify: `pages/pricing/pricing-toggle.html` (1 switch — the billing toggle, handled in U3)
- Modify: `pages/pricing/pricing-simple.html` (1 switch, if present)

**Approach:**

- For each `<button class="relative h-6 w-11 rounded-full ...">` switch, add `data-toggle`. Where the "on" state uses a non-default color (e.g., `bg-amber-500` in form-advanced), add `data-on="bg-amber-500"` so the handler restores the right color.
- Ensure the knob `<span>` and the button's `bg-*` class are the two things the handler toggles.

**Patterns to follow:**

- The existing switch markup in `pages/forms/form-advanced.html` (lines ~292, ~312) and `pages/profile/settings.html` (lines ~354, ~374, ~395).

**Test scenarios:**

- Happy path: each switch in settings.html and form-advanced.html flips on/off on click and returns to its original color.
- Edge case: a switch already in the "on" state (e.g., `bg-indigo-600` with knob right) toggles correctly to off and back.

**Verification:**

- All 7 switches across the two pages flip visually on click and restore their original "on" color.

---

- [ ] U3. **Wire the pricing monthly/yearly billing toggle**

**Goal:** Make the billing-cycle switch in `pricing-toggle.html` swap each plan's displayed price and suffix between monthly and yearly.

**Requirements:** R2

**Dependencies:** U1

**Files:**

- Modify: `pages/pricing/pricing-toggle.html`

**Approach:**

- Add `data-billing-toggle` to the switch button.
- For each plan's price block, add `data-monthly` and `data-yearly` attributes (e.g., `data-monthly="$9"` `data-yearly="$86"`) and a `data-suffix` on the `/mo` span (e.g., `data-suffix-mo="/mo"` `data-suffix-yr="/yr"`). The handler swaps the price text and suffix, and toggles the switch knob.
- The "or $X/year" helper line can be toggled with a `.hidden` class when yearly is active (or left as-is; decide during implementation).

**Patterns to follow:**

- The existing price markup in `pages/pricing/pricing-toggle.html` (lines ~256, ~347, ~452) and the switch at line ~218.

**Test scenarios:**

- Happy path: clicking the toggle switches all three plans from `$9/$29/$59 /mo` to their yearly equivalents and back.
- Edge case: the switch starts in the "on" (yearly) position — clicking toggles to monthly correctly.

**Verification:**

- All three plan prices and suffixes update together on each toggle click.

---

- [ ] U4. **Wire tab groups**

**Goal:** Make the tab group in `user-profile.html` switch panels and active styling.

**Requirements:** R3

**Dependencies:** U1

**Files:**

- Modify: `pages/users/user-profile.html`

**Approach:**

- Wrap the tab buttons and their content panels in a `[data-tab-group]` container.
- Add `data-tab="overview"` / `data-tab="activity"` / `data-tab="settings"` to the three tab buttons, and `data-tab-panel="overview"` (etc.) to the corresponding content panels.
- The handler (from U1) sets the active `border-indigo-600`/`text-indigo-600` classes on the clicked tab and shows the matching panel.

**Patterns to follow:**

- The existing tab markup in `pages/users/user-profile.html` (lines ~296–310) and the content panels below.

**Test scenarios:**

- Happy path: clicking Activity shows the activity feed and highlights it; clicking Settings shows settings.
- Edge case: only one panel is visible at a time.

**Verification:**

- Tab clicks switch panels and active styling correctly.

---

- [ ] U5. **Wire collapsible nav groups**

**Goal:** Make the collapsible groups in `sidebar-navigation.html` expand/collapse their sub-links.

**Requirements:** R4

**Dependencies:** U1

**Files:**

- Modify: `pages/navigation/sidebar-navigation.html`

**Approach:**

- Add `data-collapse` to each group header `<button>` and `data-collapse-group` to a wrapping container (or use the header's sibling links div directly).
- The handler toggles `.hidden` on the sibling links container and rotates the chevron `<svg>` (e.g., toggling a `rotate-180` class).

**Patterns to follow:**

- The existing collapsible markup in `pages/navigation/sidebar-navigation.html` (lines ~401 and ~456).

**Test scenarios:**

- Happy path: clicking "General" collapses/expands its sub-links and rotates the chevron.
- Edge case: the two groups collapse independently.

**Verification:**

- Both collapsible groups expand/collapse on click.

---

- [ ] U6. **Wire topbar dropdown menus**

**Goal:** Make the topbar bell and profile menus open/close as dropdowns on the layout and dashboard pages.

**Requirements:** R5

**Dependencies:** U1

**Files:**

- Modify: `pages/layouts/sidebar-light.html`
- Modify: `pages/layouts/sidebar-dark.html`
- Modify: `pages/layouts/sidebar-collapsible.html`
- Modify: `pages/layouts/topnav.html`
- Modify: `pages/dashboards/analytics.html`
- Modify: `pages/dashboards/ecommerce.html`
- Modify: `pages/dashboards/minimal.html`
- Modify: `index.html`

**Approach:**

- Add `data-dropdown="bell-menu"` to the bell button and a hidden `<div id="bell-menu">` dropdown panel (with a few sample notification items) after it.
- Add `data-dropdown="profile-menu"` to the profile avatar block and a hidden `<div id="profile-menu">` panel (Profile / Settings / Sign out) after it.
- The existing `data-dropdown` handler in `app.js` (from U1) toggles `.hidden` and closes on outside click.

**Patterns to follow:**

- The existing (dead) `data-dropdown` handler contract in `src/js/app.js`.
- The topbar bell/profile markup in `pages/layouts/sidebar-light.html` (lines ~300–330).

**Test scenarios:**

- Happy path: clicking the bell opens the notification dropdown; clicking outside closes it.
- Happy path: clicking the profile avatar opens the profile menu.
- Edge case: opening one menu closes the other.

**Verification:**

- Bell and profile dropdowns open/close on all 8 pages.

---

- [ ] U7. **Wire table search and filter**

**Goal:** Make the search inputs in the table pages filter rows, and the filter buttons toggle a filter state.

**Requirements:** R6

**Dependencies:** U1

**Files:**

- Modify: `pages/tables/table-dense.html`
- Modify: `pages/users/user-list.html`

**Approach:**

- Add `data-table-search` to the search `<input>` and `data-table` to the `<table>` it filters.
- The handler filters `<tbody>` rows by text content (case-insensitive), hiding non-matches with `.hidden`.
- For the Filter button, add `data-filter-toggle` to toggle a "filter active" visual state (e.g., a highlighted button) — a real filter dropdown is out of scope.

**Patterns to follow:**

- The search input + table markup in `pages/tables/table-dense.html` (lines ~220–240) and `pages/users/user-list.html` (line ~233).

**Test scenarios:**

- Happy path: typing "Sarah" in the search filters the table to matching rows.
- Edge case: an empty search restores all rows.
- Edge case: no rows match — the table shows an empty state (or all rows hidden).

**Verification:**

- Search filters rows live on both table pages; filter button toggles its active state.

---

- [ ] U8. **Wire toast dismiss buttons**

**Goal:** Make the close buttons on toast cards dismiss them.

**Requirements:** R7

**Dependencies:** U1

**Files:**

- Modify: `pages/toasts/toast-notifications.html`
- Modify: `pages/toasts/toast-positions.html`
- Modify: `pages/toasts/toast-stacked.html`

**Approach:**

- Add `data-dismiss` to each toast close `<button class="text-gray-400 hover:text-gray-600">`.
- The handler hides the closest toast card (`.closest` to the card container) with `.hidden`.

**Patterns to follow:**

- The toast close buttons in `pages/toasts/toast-notifications.html` (lines ~247, ~309, ~370, ~419).

**Test scenarios:**

- Happy path: clicking a toast's close button hides that toast only.
- Edge case: dismissing one toast in a stack leaves the others visible.

**Verification:**

- Toast close buttons dismiss their toast on all three toast pages.

---

- [ ] U9. **Wire pagination controls**

**Goal:** Make pagination buttons navigate between page states (active highlight).

**Requirements:** R8

**Dependencies:** U1

**Files:**

- Modify: `pages/navigation/pagination.html`
- Modify: `pages/users/user-list.html` (if it has pagination)

**Approach:**

- Add `data-page` to each numbered page button and `data-page-group` to the pagination container.
- The handler sets the clicked button active (e.g., `bg-indigo-600 text-white`) and clears siblings. Prev/next buttons can step the active page.

**Patterns to follow:**

- The pagination markup in `pages/navigation/pagination.html` (numbered buttons with `bg-indigo-600` active state).

**Test scenarios:**

- Happy path: clicking page 3 highlights it and clears page 2.
- Edge case: prev/next step the active page without going out of range.

**Verification:**

- Pagination buttons update the active page on click.

---

- [ ] U10. **Verify build and commit**

**Goal:** Confirm all pages still build cleanly and the interactivity works, then commit.

**Requirements:** R9

**Dependencies:** U1–U9

**Files:**

- Verify: `index.html` and all modified pages build via the existing Vite multi-page config.

**Approach:**

- Run the production build; confirm no errors and all 55 pages are emitted.
- Spot-check that no page lost its `app.js` script tag and that added attributes are well-formed.
- Commit the full change set.

**Test scenarios:**

- Integration: the production build succeeds with all modified pages.
- Integration: every modified page still includes `<script type="module" src="/src/js/app.js">`.

**Verification:**

- `npm run build` succeeds; all 55 pages present in `dist/`; working tree clean after commit.

---

## System-Wide Impact

- **Interaction graph:** `src/js/app.js` is the single entry point; all 49 pages that load it gain the new handlers. Pages without the new data attributes are unaffected (guarded listeners).
- **Error propagation:** Handlers are guarded (`if (el)`) so a missing element on any page never throws.
- **State lifecycle risks:** All state is DOM-class-based and resets on reload — no persistence, no partial-write risk.
- **API surface parity:** No public API or external contract changes; only internal data attributes added to existing markup.
- **Integration coverage:** The pricing toggle (U3) and table search (U7) are the cross-element behaviors; unit-test them in-browser.
- **Unchanged invariants:** The sidebar toggle/collapse behavior, the `.collapsed` CSS, and the standalone error/auth pages are untouched.

---

## Risks & Dependencies

| Risk | Mitigation |
| ------ | ------------ |
| Toggle "on" color varies per page (indigo vs amber) | Use a `data-on` attribute per switch so the handler restores the correct color |
| Adding dropdown panels to 8 pages is repetitive | Reuse one consistent panel markup snippet; the shared handler does the work |
| A page could lose its `app.js` script tag during edits | U10 verifies every modified page still includes the script tag |
| Native selects are out of scope but look "interactive" | Explicitly deferred; documented in Scope Boundaries |

---

## Documentation / Operational Notes

- Update `README.md` to note that demo components are now interactive (toggles, tabs, dropdowns, search, toasts, pagination) driven by the shared `src/js/app.js`.
- No deployment, monitoring, or rollout impact — static site.

---

## Sources & References

- Related code: `src/js/app.js`, `src/css/app.css`
- Related pages: `pages/forms/form-advanced.html`, `pages/profile/settings.html`, `pages/pricing/pricing-toggle.html`, `pages/users/user-profile.html`, `pages/navigation/sidebar-navigation.html`, `pages/tables/table-dense.html`, `pages/users/user-list.html`, `pages/toasts/*`, `pages/layouts/*`, `pages/dashboards/*`, `index.html`
