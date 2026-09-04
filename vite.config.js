import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import { globSync } from "fs";
import { resolve } from "path";
import viteChromeInject from "./plugins/vite-chrome-inject.js";

// Multi-page build: include every real page as an entry (index.html + pages/**).
// Chrome partials under src/chrome/ are injected, not standalone pages, so they
// are excluded by scoping the glob to the real page roots.
const pages = Object.fromEntries(
    globSync(["index.html", "pages/**/*.html"], {
        ignore: ["node_modules/**", "dist/**"],
    }).map((file) => [file.replace(/\.html$/, ""), resolve(__dirname, file)]),
);

export default defineConfig(({ command }) => ({
    // Relative asset links in built output so dist/ works via file:// and
    // from any subpath; dev server keeps absolute /src/... for HMR.
    base: command === "build" ? "./" : "/",
    plugins: [viteChromeInject(), tailwindcss()],
    build: {
        rollupOptions: {
            input: pages,
        },
    },
    server: {
        open: true,
    },
}));
