export async function onRequest({ request }) {
  const url = new URL(request.url)
  const newUrl = new URL("https://eu-assets.i.posthog.com")
  newUrl.pathname = url.pathname.replace(/^\/ph-ui/, "")
  return fetch(newUrl, { cf: { cacheTtl: 86400 } })
}
