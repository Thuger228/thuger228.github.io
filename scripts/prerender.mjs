// Build-time pre-rendering: turns every route into a static HTML file so search engines,
// social previews and AI crawlers get real content (and real URLs instead of 404s on GitHub Pages).
// Runs after `vite build` (client) and `vite build --ssr` (server bundle) - see "build" in package.json.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const distDir = path.join(root, "dist");
const ssrDir = path.join(root, "dist-ssr");

const { render, LANGUAGES, PAGES, DEFAULT_LANGUAGE, SITE_URL, pagePath } = await import(
  pathToFileURL(path.join(ssrDir, "entry-server.js")).href
);

const template = fs.readFileSync(path.join(distDir, "index.html"), "utf-8");

const renderPage = (url) => {
  const { html, head, htmlAttributes } = render(url);
  return template
    .replace(/<html[^>]*>/, `<html ${htmlAttributes}>`)
    .replace("<!--app-head-->", head)
    .replace("<!--app-html-->", html);
};

const writeFile = (relPath, contents) => {
  const file = path.join(distDir, relPath);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, contents);
  console.log(`  ${relPath}`);
};

console.log("Pre-rendering pages:");
for (const lang of LANGUAGES) {
  for (const slug of PAGES) {
    const url = pagePath(lang, slug);
    writeFile(path.join(url, "index.html"), renderPage(url));
  }
}

// GitHub Pages serves 404.html for unknown paths.
writeFile("404.html", renderPage("/404-not-found/"));

// Sitemap with hreflang alternates for every page.
const today = new Date().toISOString().slice(0, 10);
const urls = PAGES.flatMap((slug) =>
  LANGUAGES.map((lang) => {
    const alternates = [
      ...LANGUAGES.map(
        (alt) => `    <xhtml:link rel="alternate" hreflang="${alt}" href="${SITE_URL}${pagePath(alt, slug)}"/>`
      ),
      `    <xhtml:link rel="alternate" hreflang="x-default" href="${SITE_URL}${pagePath(DEFAULT_LANGUAGE, slug)}"/>`,
    ].join("\n");
    return `  <url>
    <loc>${SITE_URL}${pagePath(lang, slug)}</loc>
    <lastmod>${today}</lastmod>
${alternates}
  </url>`;
  })
);
writeFile(
  "sitemap.xml",
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join("\n")}
</urlset>
`
);

fs.rmSync(ssrDir, { recursive: true, force: true });
