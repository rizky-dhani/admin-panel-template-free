// Vite plugin: inject shared chrome (head + sidebar shell + nav) into source
// pages at dev/build time. Source pages carry HTML-comment markers:
//   <!-- @chrome:head title="..." favicon="..." -->
//   <!-- @chrome:sidebar-open variant="dark|light|collapsible" -->
//   [page's own brand block]
//   <!-- @chrome:sidebar-nav variant="dark|light|collapsible" -->
//   [page's own header + main]
//   <!-- @chrome:close -->
// The plugin replaces them with the head partial, the sidebar shell (open +
// nav + user menu) generated from src/chrome/nav.json, and the closing tags.
// The brand block stays inline as page content (it varies per page). dist/
// output is fully static HTML.
import { readFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const CHROME = join(ROOT, "src", "chrome");

// --- nav.json + head partial cache (re-read on change) ---
let nav = null;
let headPartial = "";

function loadNav() {
  try {
    nav = JSON.parse(readFileSync(join(CHROME, "nav.json"), "utf8"));
  } catch (err) {
    throw new Error(
      `[vite-chrome-inject] failed to load src/chrome/nav.json: ${err.message}`,
    );
  }
}

function loadHead() {
  headPartial = readFileSync(join(CHROME, "head.html"), "utf8");
}

function loadAll() {
  loadNav();
  loadHead();
}

// --- sidebar shell per variant (open + nav + user menu) ---
// The brand block is intentionally NOT here — it is page-specific content that
// each page carries inline between the open and nav markers.
const SHELL = {
  dark: {
    open:
      `<body class="bg-gray-100 font-sans text-gray-900 antialiased">\n` +
      `        <div class="flex min-h-screen">\n` +
      `            <!-- Sidebar -->\n` +
      `            <aside\n` +
      `                id="sidebar"\n` +
      `                class="fixed inset-y-0 left-0 z-40 flex w-64 -translate-x-full flex-col bg-gray-900 transition-transform duration-200 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0"\n` +
      `            >\n`,
    navOpen: `<nav class="flex-1 space-y-1 overflow-y-auto px-3 py-4">`,
    afterNav:
      `\n\n                <!-- User -->\n` +
      `                <div class="relative border-t border-gray-800 p-4">\n` +
      `                    <button\n` +
      `                        data-dropdown="sidebar-user-menu"\n` +
      `                        class="flex w-full cursor-pointer items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"\n` +
      `                        type="button"\n` +
      `                    >\n` +
      `                        <img\n` +
      `                            class="h-9 w-9 rounded-full object-cover"\n` +
      `                            src="https://i.pravatar.cc/80?img=12"\n` +
      `                            alt="User"\n` +
      `                        />\n` +
      `                        <div class="min-w-0 flex-1">\n` +
      `                            <p class="truncate text-sm font-medium text-white">\n` +
      `                                Alex Morgan\n` +
      `                            </p>\n` +
      `                            <p class="truncate text-xs text-gray-400">\n` +
      `                                alex@acme.com\n` +
      `                            </p>\n` +
      `                        </div>\n` +
      `                        <svg\n` +
      `                            class="ml-auto h-4 w-4 shrink-0 text-gray-500 transition-transform"\n` +
      `                            data-user-chevron\n` +
      `                            fill="none"\n` +
      `                            stroke="currentColor"\n` +
      `                            viewBox="0 0 24 24"\n` +
      `                        >\n` +
      `                            <path\n` +
      `                                stroke-linecap="round"\n` +
      `                                stroke-linejoin="round"\n` +
      `                                stroke-width="2"\n` +
      `                                d="M19 9l-7 7-7-7"\n` +
      `                            />\n` +
      `                        </svg>\n` +
      `                    </button>\n` +
      `                    <div\n` +
      `                        id="sidebar-user-menu"\n` +
      `                        class="absolute bottom-full right-0 z-30 mb-2 hidden w-56 rounded-xl border border-gray-700 bg-gray-800 p-2 shadow-lg"\n` +
      `                    >\n` +
      `                        <p\n` +
      `                            class="truncate px-3 pb-1 pt-1 text-xs text-gray-400"\n` +
      `                        >\n` +
      `                            Signed in as alex@acme.com\n` +
      `                        </p>\n` +
      `                        <a\n` +
      `                            href="/pages/profile/profile.html"\n` +
      `                            class="block rounded-lg px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"\n` +
      `                            >Profile</a\n` +
      `                        >\n` +
      `                        <a\n` +
      `                            href="/pages/profile/profile.html"\n` +
      `                            class="block rounded-lg px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"\n` +
      `                            >Settings</a\n` +
      `                        >\n` +
      `                        <div class="my-1 h-px bg-gray-700"></div>\n` +
      `                        <a\n` +
      `                            href="/pages/auth/login-centered.html"\n` +
      `                            class="block rounded-lg px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300"\n` +
      `                            >Sign out</a\n` +
      `                        >\n` +
      `                    </div>\n` +
      `                </div>\n` +
      `            </aside>\n` +
      `\n            <!-- Overlay -->\n` +
      `            <div\n` +
      `                id="sidebar-overlay"\n` +
      `                class="fixed inset-0 z-30 hidden bg-gray-900/50 lg:hidden"\n` +
      `            ></div>\n` +
      `\n            <!-- Main -->\n` +
      `            <div class="flex min-w-0 flex-1 flex-col">\n`,
  },
  light: {
    open:
      `<body class="bg-gray-50 font-sans text-gray-900 antialiased">\n` +
      `        <div class="flex min-h-screen">\n` +
      `            <!-- Sidebar -->\n` +
      `            <aside\n` +
      `                id="sidebar"\n` +
      `                class="fixed inset-y-0 left-0 z-40 flex w-64 -translate-x-full flex-col border-r border-gray-200 bg-white transition-transform duration-200 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0"\n` +
      `            >\n`,
    navOpen: `<nav class="flex-1 space-y-1 overflow-y-auto px-3 py-4">`,
    afterNav:
      `\n\n                <!-- User -->\n` +
      `                <div class="relative border-t border-gray-200 p-4">\n` +
      `                    <button\n` +
      `                        data-dropdown="sidebar-user-menu"\n` +
      `                        class="flex w-full cursor-pointer items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"\n` +
      `                        type="button"\n` +
      `                    >\n` +
      `                        <img\n` +
      `                            class="h-9 w-9 rounded-full object-cover"\n` +
      `                            src="https://i.pravatar.cc/80?img=12"\n` +
      `                            alt="User"\n` +
      `                        />\n` +
      `                        <div class="min-w-0 flex-1">\n` +
      `                            <p\n` +
      `                                class="truncate text-sm font-medium text-gray-900"\n` +
      `                            >\n` +
      `                                Alex Morgan\n` +
      `                            </p>\n` +
      `                            <p class="truncate text-xs text-gray-500">\n` +
      `                                alex@acme.com\n` +
      `                            </p>\n` +
      `                        </div>\n` +
      `                        <svg\n` +
      `                            class="ml-auto h-4 w-4 shrink-0 text-gray-400 transition-transform"\n` +
      `                            data-user-chevron\n` +
      `                            fill="none"\n` +
      `                            stroke="currentColor"\n` +
      `                            viewBox="0 0 24 24"\n` +
      `                        >\n` +
      `                            <path\n` +
      `                                stroke-linecap="round"\n` +
      `                                stroke-linejoin="round"\n` +
      `                                stroke-width="2"\n` +
      `                                d="M19 9l-7 7-7-7"\n` +
      `                            />\n` +
      `                        </svg>\n` +
      `                    </button>\n` +
      `                    <div\n` +
      `                        id="sidebar-user-menu"\n` +
      `                        class="absolute bottom-full right-0 z-30 mb-2 hidden w-56 rounded-xl border border-gray-200 bg-white p-2 shadow-lg"\n` +
      `                    >\n` +
      `                        <p\n` +
      `                            class="truncate px-3 pb-1 pt-1 text-xs text-gray-500"\n` +
      `                        >\n` +
      `                            Signed in as alex@acme.com\n` +
      `                        </p>\n` +
      `                        <a\n` +
      `                            href="/pages/profile/profile.html"\n` +
      `                            class="block rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"\n` +
      `                            >Profile</a\n` +
      `                        >\n` +
      `                        <a\n` +
      `                            href="/pages/profile/profile.html"\n` +
      `                            class="block rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"\n` +
      `                            >Settings</a\n` +
      `                        >\n` +
      `                        <div class="my-1 h-px bg-gray-100"></div>\n` +
      `                        <a\n` +
      `                            href="/pages/auth/login-centered.html"\n` +
      `                            class="block rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50"\n` +
      `                            >Sign out</a\n` +
      `                        >\n` +
      `                    </div>\n` +
      `                </div>\n` +
      `            </aside>\n` +
      `\n            <!-- Overlay -->\n` +
      `            <div\n` +
      `                id="sidebar-overlay"\n` +
      `                class="fixed inset-0 z-30 hidden bg-gray-900/50 lg:hidden"\n` +
      `            ></div>\n` +
      `\n            <!-- Main -->\n` +
      `            <div class="flex min-w-0 flex-1 flex-col">\n`,
  },
  collapsible: {
    open:
      `<body class="bg-gray-50 font-sans text-gray-900 antialiased">\n` +
      `        <div class="flex min-h-screen">\n` +
      `            <!-- Sidebar -->\n` +
      `            <aside\n` +
      `                id="sidebar"\n` +
      `                class="fixed inset-y-0 left-0 z-40 flex w-64 -translate-x-full flex-col border-r border-gray-200 bg-white lg:sticky lg:top-0 lg:h-screen lg:translate-x-0"\n` +
      `            >\n`,
    navOpen: `<nav class="flex-1 space-y-1 overflow-y-auto px-3 py-4">`,
    afterNav:
      `\n\n                <!-- User -->\n` +
      `                <div class="relative border-t border-gray-200 p-4">\n` +
      `                    <button\n` +
      `                        data-dropdown="sidebar-user-menu"\n` +
      `                        class="user-box flex w-full cursor-pointer items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"\n` +
      `                        type="button"\n` +
      `                    >\n` +
      `                        <img\n` +
      `                            class="h-9 w-9 shrink-0 rounded-full object-cover"\n` +
      `                            src="https://i.pravatar.cc/80?img=12"\n` +
      `                            alt="User"\n` +
      `                        />\n` +
      `                        <div class="user-info min-w-0 flex-1">\n` +
      `                            <p\n` +
      `                                class="truncate text-sm font-medium text-gray-900"\n` +
      `                            >\n` +
      `                                Alex Morgan\n` +
      `                            </p>\n` +
      `                            <p class="truncate text-xs text-gray-500">\n` +
      `                                alex@acme.com\n` +
      `                            </p>\n` +
      `                        </div>\n` +
      `                        <svg\n` +
      `                            class="user-info ml-auto h-4 w-4 shrink-0 text-gray-400 transition-transform"\n` +
      `                            data-user-chevron\n` +
      `                            fill="none"\n` +
      `                            stroke="currentColor"\n` +
      `                            viewBox="0 0 24 24"\n` +
      `                        >\n` +
      `                            <path\n` +
      `                                stroke-linecap="round"\n` +
      `                                stroke-linejoin="round"\n` +
      `                                stroke-width="2"\n` +
      `                                d="M19 9l-7 7-7-7"\n` +
      `                            />\n` +
      `                        </svg>\n` +
      `                    </button>\n` +
      `                    <div\n` +
      `                        id="sidebar-user-menu"\n` +
      `                        class="absolute bottom-full right-0 z-30 mb-2 hidden w-56 rounded-xl border border-gray-200 bg-white p-2 shadow-lg"\n` +
      `                    >\n` +
      `                        <p\n` +
      `                            class="truncate px-3 pb-1 pt-1 text-xs text-gray-500"\n` +
      `                        >\n` +
      `                            Signed in as alex@acme.com\n` +
      `                        </p>\n` +
      `                        <a\n` +
      `                            href="/pages/profile/profile.html"\n` +
      `                            class="block rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"\n` +
      `                            >Profile</a\n` +
      `                        >\n` +
      `                        <a\n` +
      `                            href="/pages/profile/profile.html"\n` +
      `                            class="block rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"\n` +
      `                            >Settings</a\n` +
      `                        >\n` +
      `                        <div class="my-1 h-px bg-gray-100"></div>\n` +
      `                        <a\n` +
      `                            href="/pages/auth/login-centered.html"\n` +
      `                            class="block rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50"\n` +
      `                            >Sign out</a\n` +
      `                        >\n` +
      `                    </div>\n` +
      `                </div>\n` +
      `            </aside>\n` +
      `\n            <!-- Overlay -->\n` +
      `            <div\n` +
      `                id="sidebar-overlay"\n` +
      `                class="fixed inset-0 z-30 hidden bg-gray-900/50 lg:hidden"\n` +
      `            ></div>\n` +
      `\n            <!-- Main -->\n` +
      `            <div class="flex min-w-0 flex-1 flex-col">\n`,
  },
};

// --- nav generation (ported from scripts/build_sidebar_dropdowns.py) ---

function currentSection(filePath) {
  const rel = relative(ROOT, filePath).split("/");
  if (rel[0] === "index.html") return "dashboards";
  if (rel[0] === "pages" && rel[1] === "sections") {
    return rel[2].replace(/\.html$/, "");
  }
  if (rel[0] === "pages" && rel[1]) return rel[1];
  return null;
}

function buildBlock(section, light, active, expanded) {
  const count = section.pages.length;
  const headerCls = active
    ? light
      ? "flex w-full items-center gap-3 rounded-lg bg-indigo-50 px-3 py-2.5 text-sm font-semibold text-indigo-700"
      : "flex w-full items-center gap-3 rounded-lg bg-indigo-600 px-3 py-2.5 text-sm font-medium text-white"
    : light
      ? "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900"
      : "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white";
  const badgeCls = active
    ? light
      ? "nav-badge ml-auto rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700"
      : "nav-badge ml-auto rounded-full bg-indigo-500 px-2 py-0.5 text-xs text-white"
    : light
      ? "nav-badge ml-auto rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600"
      : "nav-badge ml-auto rounded-full bg-gray-800 px-2 py-0.5 text-xs text-gray-400";
  const chevronCls = "h-4 w-4" + (expanded ? " rotate-180" : "");
  const subCls = expanded ? "space-y-1" : "space-y-1 hidden";
  const sublinkCls = light
    ? "block rounded-lg py-2 pl-10 pr-3 text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-900"
    : "block rounded-lg py-2 pl-10 pr-3 text-sm text-gray-400 hover:bg-gray-800 hover:text-white";

  const lines = [
    '                    <div class="space-y-1">',
    "                        <button",
    '                            type="button"',
    "                            data-collapse",
    `                            class="${headerCls}"`,
    "                        >",
    "                            <svg",
    '                                class="h-5 w-5"',
    '                                fill="none"',
    '                                stroke="currentColor"',
    '                                viewBox="0 0 24 24"',
    "                            >",
    "                                <path",
    '                                    stroke-linecap="round"',
    '                                    stroke-linejoin="round"',
    '                                    stroke-width="2"',
    `                                    d="${section.icon}"`,
    "                                />",
    "                            </svg>",
    `                            <span class="nav-label">${section.label}</span>`,
    "                            <span",
    `                                class="${badgeCls}"`,
    `                                >${count}</span`,
    "                            >",
    "                            <svg",
    `                                class="${chevronCls}"`,
    "                                data-chevron",
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
    "                            data-collapse-target",
    `                            class="${subCls}"`,
    "                        >",
  ];
  for (const page of section.pages) {
    lines.push(
      `                            <a\n` +
        `                                href="${page.href}"\n` +
        `                                class="${sublinkCls}"\n` +
        `                            >\n` +
        `                                ${page.label}\n` +
        `                            </a>`,
    );
  }
  lines.push("                        </div>");
  lines.push("                    </div>");
  return lines.join("\n");
}

function buildNav(light, current) {
  const labelCls = light
    ? "section-label px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-gray-400"
    : "section-label px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-gray-500";
  const body = [
    "\n" +
      `                    <p class="${labelCls}">\n` +
      "                        Sections\n" +
      "                    </p>",
  ];
  for (const section of nav.sections) {
    const active = section.key === current;
    body.push(buildBlock(section, light, active, active));
  }
  return body.join("\n");
}

// --- marker replacement ---

function resolveTitle(marker, filePath) {
  const m = marker.match(/title="([^"]*)"/);
  if (m) return m[1];
  const href = "/" + relative(ROOT, filePath).replace(/\\/g, "/");
  for (const section of nav.sections) {
    for (const page of section.pages) {
      if (page.href === href) {
        return `${page.label} — Admin Panel`;
      }
    }
  }
  const base = filePath
    .split("/")
    .pop()
    .replace(/\.html$/, "");
  return `${base} — Admin Panel`;
}

function resolveFavicon(marker) {
  const m = marker.match(/favicon="([^"]*)"/);
  return m ? m[1] : "🖥️";
}

function inject(html, filePath) {
  // head
  html = html.replace(/<!--\s*@chrome:head[^>]*-->/g, (marker) => {
    const title = resolveTitle(marker, filePath);
    const favicon = resolveFavicon(marker);
    return headPartial
      .replace("{{TITLE}}", title)
      .replace("{{FAVICON}}", favicon);
  });

  // sidebar open
  html = html.replace(
    /<!--\s*@chrome:sidebar-open\s+variant="([^"]*)"[^>]*-->/g,
    (_m, variant) => {
      const shell = SHELL[variant];
      if (!shell) {
        throw new Error(
          `[vite-chrome-inject] unknown sidebar variant "${variant}" in ${filePath}`,
        );
      }
      return shell.open;
    },
  );

  // sidebar nav (nav + user menu + close)
  html = html.replace(
    /<!--\s*@chrome:sidebar-nav\s+variant="([^"]*)"[^>]*-->\s*/g,
    (marker, variant) => {
      const shell = SHELL[variant];
      if (!shell) {
        throw new Error(
          `[vite-chrome-inject] unknown sidebar variant "${variant}" in ${filePath}`,
        );
      }
      const light = variant === "light" || variant === "collapsible";
      const current = currentSection(filePath);
      const navHtml = buildNav(light, current);
      const userAvatar =
        marker.match(/user-avatar="([^"]*)"/)?.[1] ||
        "https://i.pravatar.cc/80?img=12";
      const userName =
        marker.match(/user-name="([^"]*)"/)?.[1] || "Alex Morgan";
      const userEmail =
        marker.match(/user-email="([^"]*)"/)?.[1] || "alex@acme.com";
      const userSignedIn =
        marker.match(/user-signedin="([^"]*)"/)?.[1] || "alex@acme.com";
      const shellSrc =
        shell.navOpen +
        "\n                    {{NAV}}\n                </nav>" +
        shell.afterNav;
      return shellSrc
        .replace("{{NAV}}", navHtml)
        .replace("https://i.pravatar.cc/80?img=12", userAvatar)
        .replace("Alex Morgan", userName)
        .replace("Signed in as alex@acme.com", `Signed in as ${userSignedIn}`)
        .replace("alex@acme.com", userEmail);
    },
  );

  // close — source pages end with their own </html>; this supplies the body
  // close + app.js script (the wrapper divs opened by the sidebar shell).
  html = html.replace(
    /<!--\s*@chrome:close\s*-->/g,
    () =>
      `\n            </div>\n        </div>\n\n        <script type="module" src="/src/js/app.js"></script>\n    </body>\n`,
  );

  return html;
}

export default function viteChromeInject() {
  loadAll();
  return {
    name: "vite-chrome-inject",
    enforce: "pre",
    configureServer(server) {
      server.watcher.add(join(CHROME, "**/*"));
      server.watcher.on("change", (file) => {
        if (file.startsWith(CHROME)) {
          loadAll();
          server.ws.send({ type: "full-reload" });
        }
      });
    },
    transformIndexHtml: {
      order: "pre",
      handler(html, ctx) {
        return inject(html, ctx.filename);
      },
    },
  };
}
