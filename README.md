# Admin Panel Template (Free)

A collection of hand-built admin panel pages using **pure HTML + Tailwind CSS v4**. No framework — just clean, copy-pasteable markup so you can pick variations you like.

This is the **free** edition — one page per section, MIT-clean, dependency-free. The **PRO** edition (private) adds every variant, the Workspace & Social sections, and premium widgets (ApexCharts, rich-text editor, file upload, drag-sort, vector map).

All demo components are **interactive** and driven by one shared script (`src/js/app.js`) via data attributes — toggle switches, billing toggles, tabs, collapsible nav groups, topbar/dropdown menus, table search & filter, toast dismiss buttons, and pagination.

## Quick start

```bash
npm install
npm run dev      # start dev server (opens browser)
npm run build    # production build to /dist
npm run build:dist  # build + verify the distributable output
npm run preview  # preview the production build
```

## Chrome & Navigation

The shared sidebar, head, and nav are **single-source** and injected at build
time by a Vite plugin — source pages are content-only, while `dist/` stays
fully static and standalone. To add a page or reorder sections, edit
`src/chrome/nav.json` and the page markers; see `docs/CHROME.md` for the full
guide.

## Pages included

### Layouts

- **Dark Sidebar** — classic dark sidebar + light content
- **Light Sidebar** — clean light sidebar
- **Top Navigation** — full-width topbar, no sidebar
- **Collapsible Sidebar** — sidebar that collapses to icon-only via a topbar toggle

### Dashboards

- **Analytics** — stat grid, chart + traffic split, orders table
- **E-commerce** — KPI strip, main column + right summary rail
- **Minimal** — big-number hero cards, metric tiles, full-width chart

### Tables

- **Standard Table** — full-width bordered table with avatars & actions
- **Card Table** — orders displayed as distinct cards
- **Dense Table** — compact rows + search + pagination

### Forms

- **Basic Form** — single-column inputs
- **Advanced Form** — grid columns, selects, price prefix, toggles
- **Validation** — error / success / helper states

### Auth

- **Centered Card**
- **Split Layout** — brand panel + form
- **Modern Gradient** — gradient backdrop

### Components

- **Buttons** — solid, outline, soft, sizes, icons
- **Badges & Alerts** — status pills and notification banners
- **Cards** — stat, profile and gradient cards

### Profile

- **User Profile** — cover, avatar, stats and about
- **Account Settings** — profile, password, preferences
- **Notifications** — read / unread inbox feed

### Charts

- **Bar Chart** — single and grouped bars
- **Line Chart** — area and multi-series lines
- **Donut & Pie** — proportional breakdowns

### Navigation

- **Sidebar Navigation** — grouped, collapsible and icon-first
- **Breadcrumbs** — simple, slash, icon and pill styles
- **Pagination** — numbered, prev/next, load-more, compact

### Modals

- **Basic Modals** — simple, centered and scrollable dialogs
- **Confirmation** — warning, danger and prompt dialogs
- **Form Modals** — create, invite and multi-step forms

### Toasts

- **Notifications** — success, error, info and warning toasts
- **Positions** — top-right, top-center, bottom corners
- **Stacked** — toast queue, action and avatar variants

### Error Pages

- **404 Not Found**
- **403 Forbidden**
- **500 Server Error**

### Users

- **User List** — table with roles, status and actions
- **User Grid** — avatar cards in a responsive grid
- **User Profile** — cover, stats, tabs and activity

### Pricing

- **Simple Plans** — 3-tier cards with popular highlight
- **Comparison** — feature-by-feature table
- **Billing Toggle** — monthly / yearly switch

### Workspace

- **General Settings** — name, slug, timezone, language
- **Team Members** — roles, invites and removal
- **Billing** — plan, payment method and invoices

### States

- **Empty States** — inbox, projects, search results
- **Loading States** — skeletons, spinners, progress
- **Error States** — field, banner and retry errors

### Calendar

- **Month Calendar** — grid with event chips
- **Week Calendar** — time-slot event blocks
- **Timeline** — vertical activity feed

### Social

- **Social Feed** — post cards with actions
- **Messages** — conversation list + chat bubbles
- **Notifications** — grouped notification center

## Tech

- [Vite](https://vitejs.dev) (multi-page)
- [Tailwind CSS v4](https://tailwindcss.com) via `@tailwindcss/vite`
- Inter font via Google Fonts
