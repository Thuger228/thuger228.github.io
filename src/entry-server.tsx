import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import { HelmetProvider, HelmetServerState } from "react-helmet-async";
import { AppShell } from "./App";

// Used only at build time by scripts/prerender.mjs to turn each route into static HTML.
export function render(url: string) {
  const helmetContext: { helmet?: HelmetServerState } = {};
  const html = renderToString(
    <HelmetProvider context={helmetContext}>
      <StaticRouter location={url}>
        <AppShell />
      </StaticRouter>
    </HelmetProvider>
  );
  const { helmet } = helmetContext;
  return {
    html,
    htmlAttributes: helmet?.htmlAttributes.toString() ?? "",
    head: [helmet?.title, helmet?.meta, helmet?.link, helmet?.script]
      .map((part) => part?.toString() ?? "")
      .join("\n    "),
  };
}

export { LANGUAGES, PAGES, DEFAULT_LANGUAGE, SITE_URL, pagePath } from "./i18n/config";
