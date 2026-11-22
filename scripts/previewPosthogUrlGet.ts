export function previewPosthogUrlGet(url: URL): URL {
  const api = url.pathname.startsWith("/ph-api")
  const target = new URL(api ? "https://eu.i.posthog.com" : "https://eu-assets.i.posthog.com")
  target.pathname = url.pathname.replace(/^\/ph-(api|ui)/, "")
  target.search = url.search
  return target
}
