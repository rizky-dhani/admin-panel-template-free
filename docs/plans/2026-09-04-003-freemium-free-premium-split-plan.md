---
title: "Freemium: free/premium split with MIT libs in free, ApexCharts gated to PRO"
type: feat
status: active
date: 2026-09-04
---

# Freemium: free/premium split with MIT libs in free, ApexCharts gated to PRO

## Goal

Turn the single 74-page template into a **freemium product** with a free tier
and a paid PRO tier, mirroring TailAdmin's model (one-time payment, seat-based
tiers, license-gated features) while keeping the free tier **vanilla + MIT-clean**
as the differentiator.

## Decisions (locked)

- **D1 — MIT interactive libs ship in the free tier.** Chart.js, FullCalendar,
  flatpickr, dropzone, tiptap/LiteEditor are MIT and safe to give away. TailAdmin
  ships ApexCharts + FullCalendar + Alpine in its free tier and still sells PRO,
  so shipping interactive libs in free does not kill PRO sales. The upsell is
  **page count + license + support**, not the widgets.
- **D2 — Free stays vanilla (no Alpine/framework).** Libs are opt-in per page and
  code-split so non-widget pages never ship them. This preserves the
  "copy-pasteable, framework-free" differentiator that beats TailAdmin's
  Alpine-bound free tier.
- **D3 — ApexCharts is PRO-only.** Its commercial license ($199/dev/yr, no
  competing products) conflicts with a free giveaway. Chart.js covers free
  charting; ApexCharts is the "premium charting" upsell.
- **D4 — Free = 1 variant per section.** 18 sections → 18 free pages + index.
  Matches TailAdmin's 18-page free tier exactly.
- **D5 — Premium-only sections: workspace + social.** These are the "real app"
  pages that gate cleanly to PRO.
- **D6 — Build split via a flag over one source tree.** The chrome refactor
  (nav.json + plugin + glob) makes `dist-free` / `dist-pro` a build-time filter,
  not a fork.

## Free / Premium page matrix

### FREE (19 pages: index + 1 variant per section)

| Section | Free page |
| --- | --- |
| Dashboards | `index.html` (Analytics) |
| Layouts | `sidebar-dark.html` |
| Tables | `table-standard.html` |
| Forms | `form-basic.html` |
| Auth | `login-centered.html` |
| Components | `buttons.html` |
| Profile | `profile.html` |
| Charts | `chart-line.html` (Chart.js interactive) |
| Navigation | `breadcrumbs.html` |
| Modals | `modal-basic.html` |
| Toasts | `toast-notifications.html` |
| Errors | `error-404.html` |
| Users | `user-list.html` |
| Pricing | `pricing-simple.html` |
| States | `state-empty.html` |
| Calendar | `calendar-month.html` (FullCalendar interactive) |
| Sections | `sections/dashboards.html` (section index) |
| Workspace | *(PRO-only)* |
| Social | *(PRO-only)* |

### PREMIUM (everything else + new heavy widgets)

- All remaining variants (the other 2–3 per section).
- **Premium-only sections:** `workspace/*` (3), `social/*` (3).
- **Premium-only widgets:** ApexCharts interactive charts, rich-text editor,
  file upload, date-range picker, drag-sort, vector map.

## Widget / library matrix

| Widget | Free | PRO | License |
| --- | --- | --- | --- |
| Charts | Chart.js (line/bar/donut) | ApexCharts (zoom, brush, heatmap) | MIT / Commercial |
| Calendar | FullCalendar (month + add-event) | FullCalendar (week, resource, drag) | MIT |
| Date picker | flatpickr | flatpickr | MIT |
| File upload | dropzone | dropzone | MIT |
| Rich text | — | tiptap / LiteEditor | MIT |
| Drag-sort | — | html5sortable | MIT |
| Vector map | — | jsvectormap | MIT |
| Scaffold (dropdowns, toggles, tabs, modal, table search, pagination) | hand-rolled vanilla | hand-rolled vanilla | — |

## Pricing (mirror TailAdmin, undercut at launch)

| Tier | Seats | Projects | SaaS/redistribute | Price (intro) |
| --- | --- | --- | --- | --- |
| Free | 1 | 1 | No | $0 |
| Starter | 1 | 3 | No | **$39** |
| Business | 3 | 10 | No | **$79** |
| Extended | 10 | Unlimited | **Yes** | **$149** |

One-time payment, lifetime updates. Undercut TailAdmin (~$59/$119/$299) by
~30–45% at launch, raise after reviews/community.

## Implementation units

- [ ] U1. **Build-flag split** — add `PRO_PAGES` set; filter the Vite glob and
      `nav.json` by tier; emit `dist-free` / `dist-pro` via `npm run build:free`
      / `build:pro`.
- [ ] U2. **Free tier page set** — mark the 19 free pages; ensure free nav shows
      only free sections/pages; PRO pages excluded from free build.
- [ ] U3. **MIT libs in free** — add Chart.js + FullCalendar to the free chart
      and calendar pages, code-split so only those pages import them.
- [ ] U4. **PRO widget set** — ApexCharts, rich-text, upload, datepicker,
      drag-sort, map on PRO pages.
- [ ] U5. **License + docs** — free-tier license (restrictive, not MIT),
      `docs/FREEMIUM.md`, README update, pricing page.

## Risks

- **Free-tier license** must be restrictive (use in own projects, no
  redistribution as a template) or PRO is cannibalized. Lock before shipping.
- **ApexCharts commercial cost** is per-developer; budget a few seats in PRO
  unit economics.
- **Code-splitting** must be verified so non-widget free pages don't ship libs.
