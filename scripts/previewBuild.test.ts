import { expect, test } from "bun:test"
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { previewDistSwap } from "./previewDistSwap"

test("invalid preview backend refuses build without disturbing existing output", async () => {
  const root = await mkdtemp(join(tmpdir(), "preview-build-"))
  try {
    await mkdir(join(root, "scripts"))
    await mkdir(join(root, ".preview", "dist"), { recursive: true })
    await writeFile(join(root, ".preview", "dist", "index.html"), "old build")
    await writeFile(
      join(root, ".env.preview"),
      "PUBLIC_BASE_URL_CONVEX=https://localhost\nPUBLIC_BASE_URL_API=https://localhost\n",
    )
    // Resolve the existing dotenv dependency from the checkout without installing anything.
    const script = join(root, "scripts", "previewBuild.ts")
    await writeFile(
      script,
      (await Bun.file("scripts/previewBuild.ts").text()).replace(
        'from "dotenv"',
        `from "${import.meta.dir}/../node_modules/dotenv/lib/main.js"`,
      ),
    )
    await Bun.write(join(root, "scripts", "previewDistSwap.ts"), Bun.file("scripts/previewDistSwap.ts"))
    const child = Bun.spawn(["bun", "--no-env-file", script], { cwd: root, stdout: "ignore", stderr: "ignore" })
    expect(await child.exited).not.toBe(0)
    expect(await readFile(join(root, ".preview", "dist", "index.html"), "utf8")).toBe("old build")
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test("failed new dist rename restores the previous build", async () => {
  const root = await mkdtemp(join(tmpdir(), "preview-swap-"))
  try {
    const current = join(root, "dist")
    await mkdir(current)
    await writeFile(join(current, "index.html"), "old build")
    await expect(previewDistSwap(current, join(root, "missing"), join(root, "backup"))).rejects.toThrow()
    expect(await readFile(join(current, "index.html"), "utf8")).toBe("old build")
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})
