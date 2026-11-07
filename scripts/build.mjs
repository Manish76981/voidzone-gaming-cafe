/**
 * VoidZone Gaming Cafe — Production Build & Asset Bundler (scripts/build.mjs)
 * 1. Synchronizes index.html into worker.js (HTML_BASE64) for Cloudflare Workers parity.
 * 2. Generates the clean ./dist static output directory (index.html, _headers, _routes.json)
 *    for Cloudflare Pages deployment so SQL/config files are never exposed as public static assets.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const distDir = path.join(rootDir, "dist");

const indexHtmlPath = path.join(rootDir, "index.html");
const workerJsPath = path.join(rootDir, "worker.js");
const headersPath = path.join(rootDir, "_headers");
const routesPath = path.join(rootDir, "_routes.json");

const htmlBytes = fs.readFileSync(indexHtmlPath);
const b64 = htmlBytes.toString("base64");

let workerCode = fs.readFileSync(workerJsPath, "utf8");
workerCode = workerCode.replace(
  /const HTML_BASE64 = "[A-Za-z0-9+/=]*";/,
  `const HTML_BASE64 = "${b64}";`
);
fs.writeFileSync(workerJsPath, workerCode, "utf8");

fs.mkdirSync(distDir, { recursive: true });
fs.copyFileSync(indexHtmlPath, path.join(distDir, "index.html"));
if (fs.existsSync(headersPath)) {
  fs.copyFileSync(headersPath, path.join(distDir, "_headers"));
}
if (fs.existsSync(routesPath)) {
  fs.copyFileSync(routesPath, path.join(distDir, "_routes.json"));
}

console.log(`[build] Synced index.html (${htmlBytes.length} bytes) -> worker.js HTML_BASE64 & ./dist/`);
