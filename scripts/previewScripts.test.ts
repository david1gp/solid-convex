import { expect, test } from "bun:test"
import { readFileSync } from "node:fs"

const scripts = JSON.parse(readFileSync("package.json", "utf8")).scripts

test("preview scripts use the managed service and production preview server", () => {
  for (const name of [
    "build:preview",
    "preview:start",
    "preview:deploy",
    "preview:status",
    "preview:logs",
    "deploy:preview",
  ])
    expect(scripts[name]).toBeTruthy()
  expect(scripts["preview:start"]).toContain("--no-env-file scripts/previewServer.ts")
  expect(readFileSync("scripts/previewServer.ts", "utf8")).toContain(".preview/dist")
  expect(JSON.stringify(scripts)).not.toContain("systemctl --user")
  expect(scripts["vite:preview"]).toBeUndefined()
})
