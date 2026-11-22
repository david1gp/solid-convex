export async function onRequest({ next }) {
  const response = await next()
  if (response.headers.get("content-type")?.toLowerCase().includes("text/html")) {
    return new Response("Not found", { status: 404, headers: { "cache-control": "no-store" } })
  }
  return response
}
