import { expect, test } from "bun:test"
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"

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
    const child = Bun.spawn(["bun", "--no-env-file", script], { cwd: root, stdout: "ignore", stderr: "ignore" })
    expect(await child.exited).not.toBe(0)
    expect(await readFile(join(root, ".preview", "dist", "index.html"), "utf8")).toBe("old build")
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})
