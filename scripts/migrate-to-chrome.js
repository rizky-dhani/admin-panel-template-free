#!/usr/bin/env node
// One-shot migration: convert every page to marker-based content-only source.
//   sidebar pages -> head + sidebar-open + brand(inline) + sidebar-nav + close
//   topnav page   -> head marker only (keeps own body/header/main/script)
//   auth/error    -> head marker only (keeps own body/content)
// The brand block stays inline as page content (it varies per page); the
// plugin provides body+aside-open (open marker), nav+user+close (nav marker),
// and the final body/script close (close marker).
// Dry-run by default; pass --apply to write. Originals kept as .bak.
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const APPLY = process.argv.includes("--apply");

function walk(dir, out = []) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (e.endsWith(".html")) out.push(p);
  }
  return out;
}

const files = [join(ROOT, "index.html"), ...walk(join(ROOT, "pages"))];

const HEAD_RE = /[\s\S]*?<\/head>/;
const TITLE_RE = /<title>([^<]*)<\/title>/;
const FAVICON_RE = /<text y='\.9em' font-size='90'>(.*?)<\/text>/;
// sidebar user-menu identity (only a couple pages override these)
const USER_RE =
  /data-dropdown="sidebar-user-menu"[\s\S]{0,900}?<img[^>]*src="([^"]*)"[\s\S]{0,300}?<p\s+class="truncate text-sm[^"]*"[^>]*>\s*([^<]*?)\s*<\/p>[\s\S]{0,100}?<p\s+class="truncate text-xs[^"]*"[^>]*>\s*([^<]*?)\s*<\/p>/;
// dropdown "Signed in as X" line
const SIGNEDIN_RE = /Signed in as\s*([^<]*?)\s*<\/p>/;

function variantOf(html, file) {
  if (file.endsWith("sidebar-collapsible.html")) return "collapsible";
  const aside =
    html.match(/<aside\s+id="sidebar"[^>]*class="[^"]*"/)?.[0] || "";
  return aside.includes("bg-gray-900") ? "dark" : "light";
}

// Extract the sidebar page into: aside-open (body..aside open tag), brand
// (page content), nav (from <nav to flex-col open INCLUSIVE). The header+main
// that follow the flex-col open become the page's inline content.
function extractBrand(html, variant) {
  const asideClsRe =
    variant === "dark"
      ? /class="fixed inset-y-0 left-0 z-40 flex w-64 -translate-x-full flex-col bg-gray-900[^"]*"/
      : /class="fixed inset-y-0 left-0 z-40 flex w-64 -translate-x-full flex-col border-r border-gray-200 bg-white[^"]*"/;
  const asideOpenEnd = html.indexOf(">", html.search(asideClsRe)) + 1;
  const navStart = html.search(/<nav class="flex-1 space-y-1/);
  // brand = the block between the aside open tag and <nav>
  return html.slice(asideOpenEnd, navStart);
}

// Trailing close: </div></div> + app.js + </body></html>
const SIDEBAR_CLOSE_RE =
  /<\/div>\s*<\/div>\s*<script type="module" src="\/src\/js\/app\.js"><\/script>\s*<\/body>\s*<\/html>\s*$/;

function migrate(file) {
  const orig = readFileSync(file, "utf8");
  const rel = relative(ROOT, file);
  const title =
    orig.match(TITLE_RE)?.[1] ||
    `${rel
      .split("/")
      .pop()
      .replace(/\.html$/, "")} — Admin Panel`;
  const favicon = orig.match(FAVICON_RE)?.[1] || "🖥️";
  const userMatch = orig.match(USER_RE);
  const userAvatar = userMatch?.[1] || "https://i.pravatar.cc/80?img=12";
  const userName = userMatch?.[2] || "Alex Morgan";
  const userEmail = userMatch?.[3] || "alex@acme.com";
  const userSignedIn = orig.match(SIGNEDIN_RE)?.[1] || "alex@acme.com";
  const hasSidebar = orig.includes('id="sidebar"');

  let out;
  if (hasSidebar) {
    const variant = variantOf(orig, file);
    const head = orig.match(HEAD_RE)?.[0];
    if (!head) {
      console.error(`SKIP ${rel}: no head`);
      return false;
    }
    const rest = orig.slice(head.length).trim();
    const close = rest.match(SIDEBAR_CLOSE_RE)?.[0];
    if (!close) {
      console.error(`SKIP ${rel}: missing sidebar close anchor`);
      return false;
    }
    // Re-slice from the head-cleaned region for the sidebar parts
    const brand = extractBrand(rest, variant);
    // content between flex-col open and the trailing close
    const flexColEnd =
      rest.indexOf(
        ">",
        rest.search(/<div class="flex min-w-0 flex-1 flex-col">/),
      ) + 1;
    const contentEnd = rest.length - close.length;
    const content = rest.slice(flexColEnd, contentEnd).trim();
    out =
      `<!doctype html>\n<html lang="en">\n` +
      `    <!-- @chrome:head title="${title}" favicon="${favicon}" -->\n` +
      `    <!-- @chrome:sidebar-open variant="${variant}" -->\n` +
      `                ${brand}\n` +
      `    <!-- @chrome:sidebar-nav variant="${variant}" user-avatar="${userAvatar}" user-name="${userName}" user-email="${userEmail}" user-signedin="${userSignedIn}" -->\n` +
      `        ${content}\n` +
      `    <!-- @chrome:close -->\n</html>\n`;
  } else {
    const head = orig.match(HEAD_RE)?.[0];
    if (!head) {
      console.error(`SKIP ${rel}: no head`);
      return false;
    }
    const rest = orig.slice(head.length).trim();
    out =
      `<!doctype html>\n<html lang="en">\n` +
      `    <!-- @chrome:head title="${title}" favicon="${favicon}" -->\n` +
      `    ${rest}\n`;
  }

  if (out === orig) {
    console.log(`unchanged ${rel}`);
    return true;
  }
  if (APPLY) {
    writeFileSync(`${file}.bak`, orig);
    writeFileSync(file, out);
    console.log(
      `migrated ${rel} (${hasSidebar ? `sidebar:${variantOf(orig, file)}` : "head-only"})`,
    );
  } else {
    console.log(
      `[dry-run] would migrate ${rel} (${hasSidebar ? `sidebar:${variantOf(orig, file)}` : "head-only"})`,
    );
  }
  return true;
}

let ok = 0;
for (const f of files) if (migrate(f)) ok++;
const mode = APPLY ? "applied" : "dry-run — pass --apply to write";
console.log(`\n${ok}/${files.length} processed (${mode})`);
