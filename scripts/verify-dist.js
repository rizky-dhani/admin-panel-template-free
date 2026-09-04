#!/usr/bin/env node
// Verify the distributable dist/ output: standalone, no leaked markers,
// correct asset links, expected structure. Run after `npm run build`.
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { dirname, join, relative } from "node:path";

const ROOT = process.cwd();
const DIST = join(ROOT, "dist");

const errors = [];
const fail = (msg) => errors.push(msg);

function walk(dir, out = []) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (e.endsWith(".html")) out.push(p);
  }
  return out;
}

if (!existsSync(DIST)) {
  console.error("verify-dist: dist/ not found — run `npm run build` first.");
  process.exit(1);
}

const htmlFiles = walk(DIST);
let sidePages = 0;

for (const f of htmlFiles) {
  const h = readFileSync(f, "utf8");
  const rel = relative(DIST, f);
  const isSidebar = h.includes('id="sidebar"');

  if (!/^<!doctype html>/i.test(h)) fail(`${rel}: missing doctype`);
  if ((h.match(/<title>/g) || []).length !== 1) {
    fail(
      `${rel}: expected exactly one <title>, got ${(h.match(/<title>/g) || []).length}`,
    );
  }
  if (h.includes("@chrome")) fail(`${rel}: leaked @chrome marker in output`);
  if (
    h.includes("{{TITLE}}") ||
    h.includes("{{NAV}}") ||
    h.includes("{{FAVICON}}")
  ) {
    fail(`${rel}: unsubstituted template placeholder`);
  }
  if (h.includes('href="/src') || h.includes('src="/src')) {
    fail(`${rel}: absolute /src link not rewritten to relative`);
  }
  if (isSidebar) {
    sidePages++;
    if (!h.includes('id="sidebar-overlay"'))
      fail(`${rel}: sidebar missing overlay`);
    if (!h.includes('data-dropdown="sidebar-user-menu"')) {
      fail(`${rel}: sidebar missing user menu`);
    }
    if ((h.match(/nav-label/g) || []).length < 1) {
      fail(`${rel}: sidebar has no nav labels`);
    }
  }
}

// verify shared assets exist (resolve relative to each HTML file's directory)
for (const f of htmlFiles) {
  const h = readFileSync(f, "utf8");
  const rel = relative(DIST, f);
  for (const m of h.matchAll(/(?:src|href)="(\.[^"]*(?:css|js))"/g)) {
    const link = m[1];
    const resolved = join(dirname(f), link);
    if (!existsSync(resolved)) {
      fail(
        `${rel}: asset ${link} resolves to missing ${relative(ROOT, resolved)}`,
      );
    }
  }
}

// Tailwind must still include chrome classes (e.g. bg-gray-900 used only in dark sidebar)
const cssFiles = [];
function walkCss(dir) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walkCss(p);
    else if (e.endsWith(".css")) cssFiles.push(p);
  }
}
walkCss(join(DIST, "assets"));
const allCss = cssFiles.map((f) => readFileSync(f, "utf8")).join("");
if (!allCss.includes(".bg-gray-900")) {
  fail("Tailwind output missing .bg-gray-900 (chrome class purged)");
}

console.log(
  `verify-dist: checked ${htmlFiles.length} HTML files (${sidePages} sidebar pages), ${cssFiles.length} CSS, ${errors.length} errors`,
);
if (errors.length) {
  errors.forEach((e) => console.error(`  ✗ ${e}`));
  process.exit(1);
}
console.log("verify-dist: OK");
