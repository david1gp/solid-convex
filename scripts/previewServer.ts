import { extname, join, relative, resolve, sep } from "node:path"

const root = resolve(process.cwd(), process.env.PREVIEW_DIST_DIR || ".preview/dist")
const index = Bun.file(join(root, "index.html"))
const headersFile = Bun.file(join(root, "_headers"))
const rules: { path: string; headers: [string, string][] }[] = []
if (await headersFile.exists()) {
  for (const line of (await headersFile.text()).split("\n")) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue
    if (!/^\s/.test(line)) rules.push({ path: trimmed, headers: [] })
    else if (rules.length && trimmed.includes(":")) {
      const pos = trimmed.indexOf(":")
      rules.at(-1)?.headers.push([trimmed.slice(0, pos), trimmed.slice(pos + 1).trim()])
    }
  }
}
function applyHeaders(response: Response, path: string) {
  for (const rule of rules) {
    if (rule.path === path || (rule.path.endsWith("*") && path.startsWith(rule.path.slice(0, -1)))) {
      for (const [key, value] of rule.headers) response.headers.set(key, value)
    }
  }
  return response
}
const port = Number(process.env.PORT || 5175)
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("Invalid PORT")
const server = Bun.serve({
  port,
  hostname: process.env.HOST || "127.0.0.1",
  async fetch(request) {
    const url = new URL(request.url)
    if (url.pathname === "/__preview/health") return Response.json({ ok: true })
    if (/^\/ph-(api|ui)(\/|$)/.test(url.pathname)) {
      const api = url.pathname.startsWith("/ph-api")
      const target = new URL(
        url.pathname.replace(/^\/ph-(api|ui)/, "") + url.search,
        api ? "https://eu.i.posthog.com" : "https://eu-assets.i.posthog.com",
      )
      const headers = new Headers(request.headers)
      headers.delete("host")
      return fetch(target, {
        method: api ? request.method : "GET",
        headers: api ? headers : undefined,
        body: api && !["GET", "HEAD"].includes(request.method) ? request.body : undefined,
      })
    }
    if (!["GET", "HEAD"].includes(request.method))
      return new Response("Method Not Allowed", { status: 405, headers: { Allow: "GET, HEAD" } })
    let pathname: string
    try {
      pathname = decodeURIComponent(url.pathname)
    } catch {
      return new Response("Bad Request", { status: 400 })
    }
    if (pathname.includes("\0")) return new Response("Bad Request", { status: 400 })
    const path = resolve(root, `.${pathname.endsWith("/") ? `${pathname}index.html` : pathname}`)
    const rel = relative(root, path)
    if (rel === ".." || rel.startsWith(`..${sep}`)) return new Response("Bad Request", { status: 400 })
    const file = Bun.file(path)
    if (!pathname.startsWith("/_") && (await file.exists())) {
      const response = new Response(request.method === "HEAD" ? null : file, {
        headers: {
          "Content-Type": file.type || "application/octet-stream",
          "Content-Length": String(file.size),
          "Cache-Control": pathname.startsWith("/assets/") ? "public, max-age=31556952, immutable" : "no-cache",
        },
      })
      return applyHeaders(response, pathname)
    }
    if (pathname.startsWith("/assets/") || extname(pathname) || pathname.startsWith("/_") || !(await index.exists()))
      return new Response("Not Found", { status: 404, headers: { "Cache-Control": "no-store" } })
    return applyHeaders(
      new Response(request.method === "HEAD" ? null : index, {
        headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-cache" },
      }),
      pathname,
    )
  },
})
console.log(`[preview] serving ${root} on ${server.hostname}:${server.port}`)
process.on("SIGTERM", () => {
  server.stop()
  process.exit(0)
})
