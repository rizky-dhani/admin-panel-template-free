#!/usr/bin/env python3
"""Build the uniform 'main sidebar' with per-section dropdown toggles.

Every page that has a sidebar (67 files: index.html + 66 pages) gets the
same navigation: a "Sections" label, then one collapsible group per
section. Each section header (icon + label + count + chevron) expands to
reveal that section's real pages, each linked to its page file. The
current page's section starts expanded + highlighted.

Handles both sidebar backgrounds:
  - dark  (bg-gray-900, brand indigo-on-white)
  - light (bg-white border-r, brand indigo-on-gray)

Uses the existing [data-collapse] / [data-collapse-target] machinery in
app.js (toggle .hidden + rotate [data-chevron]). Emits .section-label /
.nav-label / .nav-badge hooks so the collapsible sidebar variant
(#sidebar.collapsed CSS) still collapses cleanly.

Idempotent: re-running regenerates the same markup.

Run from repo root:  python3 scripts/build_sidebar_dropdowns.py
"""
import glob
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# Canonical section key -> nav display label
SECTION_LABEL = {
    "dashboards": "Dashboards",
    "layouts": "Layouts",
    "tables": "Tables",
    "forms": "Forms",
    "auth": "Auth",
    "components": "Components",
    "profile": "Profile",
    "charts": "Charts",
    "navigation": "Navigation",
    "modals": "Modals",
    "toasts": "Toasts",
    "errors": "Errors",
    "users": "Users",
    "pricing": "Pricing",
    "workspace": "Workspace",
    "states": "States",
    "calendar": "Calendar",
    "social": "Social",
}

# Section key -> hero icon path (from the gallery/index sidebar)
SECTION_ICON = {
    "layouts": "M4 6h16M4 12h16M4 18h16",
    "dashboards": "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
    "tables": "M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z",
    "forms": "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z",
    "auth": "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z",
    "components": "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z",
    "profile": "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
    "charts": "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
    "navigation": "M4 6h16M4 12h16M4 18h16",
    "modals": "M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
    "toasts": "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9",
    "errors": "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z",
    "users": "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
    "pricing": "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    "workspace": "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z",
    "states": "M20 12H4M12 4v16",
    "calendar": "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
    "social": "M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z",
}

# Section key -> ordered list of (submenu label, real page href)
SUB_PAGES = {
    "layouts": [
        ("Dark Sidebar", "/pages/layouts/sidebar-dark.html"),
        ("Light Sidebar", "/pages/layouts/sidebar-light.html"),
        ("Top Navigation", "/pages/layouts/topnav.html"),
        ("Collapsible Sidebar", "/pages/layouts/sidebar-collapsible.html"),
    ],
    "dashboards": [
        ("Analytics", "/pages/dashboards/analytics.html"),
        ("E-commerce", "/pages/dashboards/ecommerce.html"),
        ("Minimal", "/pages/dashboards/minimal.html"),
    ],
    "tables": [
        ("Standard Table", "/pages/tables/table-standard.html"),
        ("Card Table", "/pages/tables/table-card.html"),
        ("Dense Table", "/pages/tables/table-dense.html"),
    ],
    "forms": [
        ("Basic Form", "/pages/forms/form-basic.html"),
        ("Advanced Form", "/pages/forms/form-advanced.html"),
        ("Validation", "/pages/forms/form-validation.html"),
    ],
    "auth": [
        ("Centered Card", "/pages/auth/login-centered.html"),
        ("Split Layout", "/pages/auth/login-split.html"),
        ("Modern Gradient", "/pages/auth/login-modern.html"),
    ],
    "components": [
        ("Buttons", "/pages/components/buttons.html"),
        ("Badges & Alerts", "/pages/components/badges-alerts.html"),
        ("Cards", "/pages/components/cards.html"),
    ],
    "profile": [
        ("User Profile", "/pages/profile/profile.html"),
        ("Account Settings", "/pages/profile/settings.html"),
        ("Notifications", "/pages/profile/notifications.html"),
    ],
    "charts": [
        ("Bar Chart", "/pages/charts/chart-bars.html"),
        ("Line Chart", "/pages/charts/chart-line.html"),
        ("Donut & Pie", "/pages/charts/chart-donut.html"),
    ],
    "navigation": [
        ("Sidebar Navigation", "/pages/navigation/sidebar-navigation.html"),
        ("Breadcrumbs", "/pages/navigation/breadcrumbs.html"),
        ("Pagination", "/pages/navigation/pagination.html"),
    ],
    "modals": [
        ("Basic Modals", "/pages/modals/modal-basic.html"),
        ("Confirmation", "/pages/modals/modal-confirmation.html"),
        ("Form Modals", "/pages/modals/modal-form.html"),
    ],
    "toasts": [
        ("Notifications", "/pages/toasts/toast-notifications.html"),
        ("Positions", "/pages/toasts/toast-positions.html"),
        ("Stacked", "/pages/toasts/toast-stacked.html"),
    ],
    "errors": [
        ("404 Not Found", "/pages/errors/error-404.html"),
        ("403 Forbidden", "/pages/errors/error-403.html"),
        ("500 Server Error", "/pages/errors/error-500.html"),
    ],
    "users": [
        ("User List", "/pages/users/user-list.html"),
        ("User Grid", "/pages/users/user-grid.html"),
        ("User Profile", "/pages/users/user-profile.html"),
    ],
    "pricing": [
        ("Simple Plans", "/pages/pricing/pricing-simple.html"),
        ("Comparison", "/pages/pricing/pricing-comparison.html"),
        ("Billing Toggle", "/pages/pricing/pricing-toggle.html"),
    ],
    "workspace": [
        ("General Settings", "/pages/workspace/workspace-general.html"),
        ("Team Members", "/pages/workspace/workspace-members.html"),
        ("Billing", "/pages/workspace/workspace-billing.html"),
    ],
    "states": [
        ("Empty States", "/pages/states/state-empty.html"),
        ("Loading States", "/pages/states/state-loading.html"),
        ("Error States", "/pages/states/state-error.html"),
    ],
    "calendar": [
        ("Month Calendar", "/pages/calendar/calendar-month.html"),
        ("Week Calendar", "/pages/calendar/calendar-week.html"),
        ("Timeline", "/pages/calendar/timeline.html"),
    ],
    "social": [
        ("Social Feed", "/pages/social/feed.html"),
        ("Messages", "/pages/social/messages.html"),
        ("Notifications", "/pages/social/notifications.html"),
    ],
}

NAV_RE = re.compile(r'(<nav class="flex-1[^>]*>)(.*?)(</nav>)', re.S)


def find_nav(html):
    m = NAV_RE.search(html)
    if not m:
        return None
    return m.group(1), m.group(2), m.group(3), m.start(2)


def sidebar_is_light(html):
    m = re.search(
        r'<aside\s+id="sidebar"[\s\S]{0,400}?class="fixed inset-y-0 left-0'
        r' z-40 flex w-64 -translate-x-full flex-col([^"]*)"',
        html,
    )
    cls = m.group(1) if m else ""
    return "bg-white" in cls


def current_section(src_path: Path):
    """The section this page belongs to (to auto-expand)."""
    p = src_path if src_path.is_absolute() else ROOT / src_path
    rel = p.relative_to(ROOT)
    parts = rel.parts
    if parts[0] == "index.html":
        return "dashboards"  # home page is the analytics dashboard
    if len(parts) >= 3 and parts[1] == "sections":
        return parts[2].replace(".html", "")
    if len(parts) >= 3:
        return parts[1]  # pages/<section>/<file>.html
    return None


def build_block(key, icon, light, active, expanded):
    lab_cls = "px-3 pb-2 text-xs font-semibold uppercase tracking-wider" + (
        " text-gray-500" if not light else " text-gray-400"
    )
    nav_label = key and SECTION_LABEL[key]
    count = len(SUB_PAGES[key])
    if active:
        header_cls = (
            "flex w-full items-center gap-3 rounded-lg bg-indigo-600 px-3 py-2.5 text-sm font-medium text-white"
            if not light
            else "flex w-full items-center gap-3 rounded-lg bg-indigo-50 px-3 py-2.5 text-sm font-semibold text-indigo-700"
        )
        badge_cls = (
            "nav-badge ml-auto rounded-full bg-indigo-500 px-2 py-0.5 text-xs text-white"
            if not light
            else "nav-badge ml-auto rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700"
        )
    else:
        header_cls = (
            "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white"
            if not light
            else "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900"
        )
        badge_cls = (
            "nav-badge ml-auto rounded-full bg-gray-800 px-2 py-0.5 text-xs text-gray-400"
            if not light
            else "nav-badge ml-auto rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600"
        )
    chevron_cls = "h-4 w-4" + (" rotate-180" if expanded else "")
    sub_cls = "space-y-1" if expanded else "space-y-1 hidden"
    sublink_cls = (
        "block rounded-lg py-2 pl-10 pr-3 text-sm text-gray-400 hover:bg-gray-800 hover:text-white"
        if not light
        else "block rounded-lg py-2 pl-10 pr-3 text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-900"
    )

    out = [
        '                    <div class="space-y-1">',
        "                        <button",
        '                            type="button"',
        '                            data-collapse',
        f'                            class="{header_cls}"',
        "                        >",
        '                            <svg',
        '                                class="h-5 w-5"',
        '                                fill="none"',
        '                                stroke="currentColor"',
        '                                viewBox="0 0 24 24"',
        "                            >",
        "                                <path",
        '                                    stroke-linecap="round"',
        '                                    stroke-linejoin="round"',
        '                                    stroke-width="2"',
        f'                                    d="{icon}"',
        "                                />",
        "                            </svg>",
        f'                            <span class="nav-label">{nav_label}</span>',
        "                            <span",
        f'                                class="{badge_cls}"',
        f"                                >{count}</span",
        "                            >",
        '                            <svg',
        f'                                class="{chevron_cls}"',
        '                                data-chevron',
        '                                fill="none"',
        '                                stroke="currentColor"',
        '                                viewBox="0 0 24 24"',
        "                            >",
        "                                <path",
        '                                    stroke-linecap="round"',
        '                                    stroke-linejoin="round"',
        '                                    stroke-width="2"',
        '                                    d="M19 9l-7 7-7-7"',
        "                                />",
        "                            </svg>",
        "                        </button>",
        "                        <div",
        '                            data-collapse-target',
        f'                            class="{sub_cls}"',
        "                        >",
    ]
    for sub_label, sub_href in SUB_PAGES[key]:
        out.append(
            f'                            <a\n'
            f'                                href="{sub_href}"\n'
            f'                                class="{sublink_cls}"\n'
            f"                            >\n"
            f"                                {sub_label}\n"
            f"                            </a>"
        )
    out.append("                        </div>")
    out.append("                    </div>")
    return out


def build_nav(light, current):
    body = []
    body.append(
        "\n"
        + '                    <p'
        + ' class="section-label px-3 pb-2 text-xs font-semibold uppercase '
        + 'tracking-wider' + (" text-gray-500" if not light else " text-gray-400") + '">\n'
        "                        Sections\n"
        "                    </p>"
    )
    for key in SECTION_LABEL:
        active = key == current
        body.extend(build_block(key, SECTION_ICON[key], light, active, active))
    return "\n".join(body)


def rebuild(html, src_path):
    nav = find_nav(html)
    if nav is None:
        return html
    open_tag, body, close_tag, body_start = nav
    light = sidebar_is_light(html)
    current = current_section(src_path)
    new_body = build_nav(light, current)
    return html[:body_start] + new_body + html[body_start + len(body):]


def main():
    targets = ["index.html"] + sorted(glob.glob(str(ROOT / "pages/**/*.html"), recursive=True))
    changed = 0
    for t in targets:
        p = ROOT / t
        if "id=\"sidebar\"" not in p.read_text():
            continue
        orig = p.read_text()
        new = rebuild(orig, p)
        if new != orig:
            p.write_text(new)
            changed += 1
        print(f"updated {t}" if new != orig else f"unchanged {t}")
    print(f"\n{changed} file(s) updated")


if __name__ == "__main__":
    main()