export async function onRequest({ request }) {
  const url = new URL(request.url)
  const newUrl = new URL("https://eu.i.posthog.com")
  newUrl.pathname = url.pathname.replace(/^\/ph-api/, "")
  newUrl.search = url.search
  return fetch(newUrl, {
    method: request.method,
    headers: request.headers,
    body: request.body,
  })
}
