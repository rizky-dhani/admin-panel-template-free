# Free ↔ Pro repo sync

## Repos

- **Pro (canonical / source of truth):** `rizky-dhani/admin-panel-template-pro` — **private**. All 74 pages, Workspace & Social sections, premium widgets.
- **Free (derived fork):** `rizky-dhani/admin-panel-template-free` — **public**. 1 page per section (`sections` hubs, Workspace, Social, and extra variants removed), MIT-clean.

## Model

Pro owns all work. Free is a **trimmed fork** — it starts from pro and then
diverges in a small, deliberate set of ways that are re-applied by hand:

1. `pages/` — only the free page set (`docs/plans/2026-09-04-003-freemium-free-premium-split-plan.md` lists them).
2. `src/chrome/nav.json` — trimmed to free sections/pages only.
3. `plugins/vite-chrome-inject.js` — the sidebar user-menu **Settings** link is repointed from `/pages/profile/settings.html` to `/pages/profile/profile.html` (the free edition has no Settings page).
4. `README.md` — "Free edition" header + PRO pointer.

Everything else (chrome partials, `app.js`, head, build config, Tailwind) is
**identical** between the repos.

## Propagating a chrome change (e.g. sidebar, head, app.js)

Do work in **pro**, then re-derive the affected free files:

```bash
# from the free repo
git remote add pro https://github.com/rizky-dhani/admin-panel-template-pro.git
git fetch pro
# copy the shared chrome/build files over from pro (they are identical)
cp pro/Admin1/src/chrome/* src/chrome/
cp pro/Admin1/plugins/* plugins/
cp pro/Admin1/src/js/app.js src/js/app.js
cp pro/Admin1/package.json vite.config.js .
# then re-apply the free divergences that touch chrome:
#   1. re-trim src/chrome/nav.json to free pages
#   2. re-point the Settings link in plugins/vite-chrome-inject.js
git commit -m "sync: pull latest chrome from pro"
git push origin main
```

> Files listed in `src/chrome/`, `plugins/`, `src/js/`, `vite.config.js`, and
> `package.json` are copied verbatim from pro *except* `src/chrome/nav.json`
> and `plugins/vite-chrome-inject.js`, which need the two re-applied edits above.
> `pages/` is never copied — it's per-repo.

## Re-derive free from scratch (when the page set changes)

If the free/premium page mix changes, the cleanest path is to reseed:

```bash
rm -rf /tmp/free && git clone <pro> /tmp/free && cd /tmp/free
# rm the non-free pages + sections hacks, trim nav.json, repoint Settings link
# commit as a free-seed branch, then push to the free repo's main
```

This keeps chrome byte-identical to pro and only carries the intended page
delta.

## Guardrails

- Never commit commercial-only lib code into the **free** repo. Chart.js /
  FullCalendar (MIT) are fine in free; ApexCharts stays pro-only.
- `verify-dist.js` in both repos checks for broken links and leaked markers —
  run it after any sync.
- The free sidebar must never link to pro-only pages. After any `nav.json` or
  chrome change, rebuild and run the link-resolve check.
