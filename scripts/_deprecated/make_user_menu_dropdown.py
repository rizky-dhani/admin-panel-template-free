#!/usr/bin/env python3
"""Convert the static bottom-user block (sidebar) into a real dropdown.

Every page with a sidebar shows a small user row pinned to the bottom
("Alex Morgan / alex@acme.com"). On most pages it is static markup with
no click behavior. This script rewrites it to use the shared
data-dropdown machinery (see app.js), producing a Profile / Settings /
Sign out menu anchored above the row.

Two sidebar themes exist in the markup:
  - dark:   border-gray-800 row, white name, gray-400 sub, gray-800 hover
  - light:  border-gray-200 row, gray-900 name, gray-500 sub, gray-50 hover
The dropdown panel and menu links follow the same theme so dark pages get
a dark menu and light pages a light menu (consistent with the three layout
pages that were hand-built: sidebar-dark/light/collapsible).

The row's avatar, name, subtitle and email are read from the existing
static block so each page keeps its own user. Only files that do NOT
already contain a dropdown (data-dropdown="sidebar-user-menu") are touched.

Run from repo root:  python3 scripts/make_user_menu_dropdown.py
"""
import re
import glob
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# ---- Regex over the whole static user block (after </nav>, before </aside>) ----
BLOCK_RE = re.compile(
    r'<div class="border-t border-gray-(800|200) p-4">.*?</div>\s*</aside>',
    re.S,
)

# Per-theme builders ---------------------------------------------------------

def extract(img_src, name_html, sub_html):
    name = re.sub(r"\s+", " ", name_html).strip()
    sub = re.sub(r"\s+", " ", sub_html).strip()
    return img_src, name, sub


def light_block(img_src, name, sub):
    return f"""                <div class="relative border-t border-gray-200 p-4">
                    <button
                        data-dropdown="sidebar-user-menu"
                        class="flex w-full cursor-pointer items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                        type="button"
                    >
                        <img
                            class="h-9 w-9 rounded-full object-cover"
                            src="{img_src}"
                            alt="User"
                        />
                        <div class="min-w-0 flex-1">
                            <p class="truncate text-sm font-medium text-gray-900">
                                {name}
                            </p>
                            <p class="truncate text-xs text-gray-500">{sub}</p>
                        </div>
                        <svg
                            class="ml-auto h-4 w-4 shrink-0 text-gray-400 transition-transform"
                            data-user-chevron
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M19 9l-7 7-7-7"
                            />
                        </svg>
                    </button>
                    <div
                        id="sidebar-user-menu"
                        class="absolute bottom-full right-0 z-30 mb-2 hidden w-56 rounded-xl border border-gray-200 bg-white p-2 shadow-lg"
                    >
                        <p class="truncate px-3 pb-1 pt-1 text-xs text-gray-500">
                            Signed in as {sub}
                        </p>
                        <a
                            href="/pages/profile/profile.html"
                            class="block rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            >Profile</a
                        >
                        <a
                            href="/pages/profile/settings.html"
                            class="block rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            >Settings</a
                        >
                        <div class="my-1 h-px bg-gray-100"></div>
                        <a
                            href="/pages/auth/login-centered.html"
                            class="block rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                            >Sign out</a
                        >
                    </div>
                </div>
            </aside>"""


def dark_block(img_src, name, sub):
    return f"""                <div class="relative border-t border-gray-800 p-4">
                    <button
                        data-dropdown="sidebar-user-menu"
                        class="flex w-full cursor-pointer items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                        type="button"
                    >
                        <img
                            class="h-9 w-9 rounded-full object-cover"
                            src="{img_src}"
                            alt="User"
                        />
                        <div class="min-w-0 flex-1">
                            <p class="truncate text-sm font-medium text-white">
                                {name}
                            </p>
                            <p class="truncate text-xs text-gray-400">{sub}</p>
                        </div>
                        <svg
                            class="ml-auto h-4 w-4 shrink-0 text-gray-500 transition-transform"
                            data-user-chevron
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M19 9l-7 7-7-7"
                            />
                        </svg>
                    </button>
                    <div
                        id="sidebar-user-menu"
                        class="absolute bottom-full right-0 z-30 mb-2 hidden w-56 rounded-xl border border-gray-700 bg-gray-800 p-2 shadow-lg"
                    >
                        <p class="truncate px-3 pb-1 pt-1 text-xs text-gray-400">
                            Signed in as {sub}
                        </p>
                        <a
                            href="/pages/profile/profile.html"
                            class="block rounded-lg px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
                            >Profile</a
                        >
                        <a
                            href="/pages/profile/settings.html"
                            class="block rounded-lg px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
                            >Settings</a
                        >
                        <div class="my-1 h-px bg-gray-700"></div>
                        <a
                            href="/pages/auth/login-centered.html"
                            class="block rounded-lg px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300"
                            >Sign out</a
                        >
                    </div>
                </div>
            </aside>"""


def transform(html):
    """Return (new_html, changed_bool)."""
    if "sidebar-user-menu" in html:
        return html, False

    m = BLOCK_RE.search(html)
    if not m:
        return html, False

    block = m.group(0)
    theme = m.group(1)  # "800" (dark) or "200" (light)

    # Pull out avatar src, name and subtitle from the existing static block.
    img = re.search(r'src="([^"]+)"', block)
    img_src = img.group(1) if img else "https://i.pravatar.cc/80?img=12"

    # Name: first <p class="truncate text-sm font-medium ..."> ... </p>
    name_m = re.search(
        r'<p[^>]*class="truncate text-sm font-medium[^"]*"[^>]*>\s*(.*?)\s*</p>',
        block,
        re.S,
    )
    name = re.sub(r"\s+", " ", name_m.group(1)).strip() if name_m else "Alex Morgan"

    # Subtitle: second line, usually text-xs text-gray-400/500
    sub_m = re.search(
        r'<p[^>]*class="truncate text-xs[^"]*"[^>]*>\s*(.*?)\s*</p>',
        block,
        re.S,
    )
    sub = re.sub(r"\s+", " ", sub_m.group(1)).strip() if sub_m else "alex@acme.com"

    if theme == "800":
        new_block = dark_block(img_src, name, sub)
    else:
        new_block = light_block(img_src, name, sub)

    # Keep the newline indentation that preceded the matched block.
    start = m.start()
    prefix = html[:start]
    if prefix.endswith("\n"):
        new_block = new_block.lstrip("\n")

    return html[:start] + new_block + html[m.end():], True


def main():
    targets = ["index.html"] + sorted(
        glob.glob(str(ROOT / "pages/**/*.html"), recursive=True)
    )
    changed = 0
    for t in targets:
        p = ROOT / t
        if 'id="sidebar"' not in p.read_text():
            continue
        if '<div class="border-t border-gray-200 p-4">' not in p.read_text() and \
           '<div class="border-t border-gray-800 p-4">' not in p.read_text():
            continue
        html = p.read_text()
        new, did = transform(html)
        if did:
            p.write_text(new)
            changed += 1
        print(f"{'updated' if did else 'unchanged'} {t}")
    print(f"\n{changed} file(s) updated")


if __name__ == "__main__":
    main()
