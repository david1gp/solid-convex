import { afterAll, beforeAll, expect, test } from "bun:test"
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"

let dir: string
let server: ReturnType<typeof Bun.spawn>
let base: string
beforeAll(async () => {
  dir = await mkdtemp(join(tmpdir(), "solid-preview-"))
  await mkdir(join(dir, "assets"))
  await writeFile(join(dir, "index.html"), "<html>preview</html>")
  await writeFile(join(dir, "assets", "app.js"), "console.log(1)")
  await writeFile(join(dir, "_headers"), "/assets/*\n  X-Test: yes\n")
  const port = Bun.serve({ port: 0, fetch: () => new Response() })
  base = `http://127.0.0.1:${port.port}`
  const number = port.port
  port.stop(true)
  server = Bun.spawn(["bun", "--no-env-file", "scripts/previewServer.ts"], {
    env: { ...process.env, PORT: String(number), HOST: "127.0.0.1", PREVIEW_DIST_DIR: dir },
    stdout: "ignore",
    stderr: "ignore",
  })
  for (let i = 0; i < 50; i++) {
    try {
      if ((await fetch(`${base}/__preview/health`)).ok) return
    } catch {}
    await Bun.sleep(20)
  }
  throw new Error("server did not start")
})
afterAll(async () => {
  server?.kill()
  await server?.exited
  await rm(dir, { recursive: true, force: true })
})
test("health, documents, static assets and HEAD follow SPA behavior", async () => {
  expect((await fetch(`${base}/__preview/health`)).status).toBe(200)
  expect(await (await fetch(`${base}/deep/link`)).text()).toContain("preview")
  const asset = await fetch(`${base}/assets/app.js`)
  expect(asset.status).toBe(200)
  expect(asset.headers.get("x-test")).toBe("yes")
  expect(asset.headers.get("cache-control")).toContain("immutable")
  expect((await fetch(`${base}/assets/missing.js`)).status).toBe(404)
  expect((await fetch(`${base}/missing.js`)).status).toBe(404)
  const head = await fetch(`${base}/deep`, { method: "HEAD" })
  expect(head.status).toBe(200)
  expect(await head.text()).toBe("")
  expect((await fetch(`${base}/%2e%2e%2foutside.txt`)).status).toBe(400)
})
