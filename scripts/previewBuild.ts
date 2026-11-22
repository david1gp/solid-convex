import { chmod, mkdir, readdir, rm } from "node:fs/promises"
import { join, resolve } from "node:path"
import { parse } from "dotenv"
import { previewDistSwap } from "./previewDistSwap"

const root = resolve(import.meta.dir, "..")
const preview = join(root, ".preview")
const next = join(preview, "dist.next")
const current = join(preview, "dist")
const backup = join(preview, "dist.previous")

async function files(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true })
  return (
    await Promise.all(
      entries.map((entry) => (entry.isDirectory() ? files(join(dir, entry.name)) : [join(dir, entry.name)])),
    )
  ).flat()
}

async function main() {
  const values = parse(await Bun.file(join(root, ".env.preview")).text())
  for (const [key, hostname] of Object.entries({
    PUBLIC_BASE_URL_CONVEX: "solid-convex-backend.wonder1.de",
    PUBLIC_BASE_URL_API: "solid-convex-api.wonder1.de",
  })) {
    if (!values[key] || new URL(values[key]).hostname !== hostname) throw new Error(`Invalid preview ${key}`)
  }
  const env = Object.fromEntries(
    Object.entries(process.env).filter(
      ([key, value]) =>
        value !== undefined && !key.startsWith("PUBLIC_") && !key.startsWith("VITE_") && key !== "NODE_ENV",
    ),
  ) as Record<string, string>
  Object.assign(env, values, { NODE_ENV: "production", PREVIEW_BUILD_DIST: next })
  await mkdir(preview, { recursive: true })
  await chmod(preview, 0o775)
  await rm(next, { recursive: true, force: true })
  const child = Bun.spawn(["bun", "--no-env-file", "./node_modules/@rsbuild/core/bin/rsbuild.js", "build"], {
    cwd: root,
    env,
    stdout: "inherit",
    stderr: "inherit",
  })
  if ((await child.exited) !== 0) throw new Error("Preview build failed")
  if (!(await Bun.file(join(next, "index.html")).exists())) throw new Error("Missing preview index.html")
  const paths = await files(next)
  let bundle = ""
  for (const path of paths) {
    await chmod(path, 0o664)
    if (/\.(?:js|html|css)$/.test(path)) bundle += await Bun.file(path).text()
  }
  for (const value of [values.PUBLIC_BASE_URL_CONVEX, values.PUBLIC_BASE_URL_API]) {
    if (!bundle.includes(value)) throw new Error(`Preview bundle missing required backend ${value}`)
  }
  // Dependencies contain localhost feature detection and router fallback strings; reject configured
  // loopback backend URLs above, and production backends or dev-client markers in the bundle.
  if (/(?:solid-convex-(?:backend|api)\.contentoren\.de|@vite\/client|__webpack_hmr|rsbuild\/client)/i.test(bundle))
    throw new Error("Preview bundle contains forbidden backend or dev client")
  async function groupDirs(dir: string) {
    await chmod(dir, 0o775)
    for (const entry of await readdir(dir, { withFileTypes: true }))
      if (entry.isDirectory()) await groupDirs(join(dir, entry.name))
  }
  await groupDirs(next)
  await previewDistSwap(current, next, backup)
  console.log("Preview build installed")
}

await main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
