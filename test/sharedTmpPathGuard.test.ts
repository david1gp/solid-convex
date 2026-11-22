import { expect, test } from "bun:test"
import { execFileSync } from "node:child_process"
import { existsSync, readFileSync } from "node:fs"

test("tracked source does not hardcode another user's temporary directory", () => {
  const files = execFileSync("git", ["ls-files", "-co", "--exclude-standard", "-z"], { encoding: "utf8" })
    .split("\0")
    .filter(Boolean)
  const forbidden = ["/tmp/" + "opencode", "/tmp/" + "leo"]
  const allow = new Set(["e2e/config/opencodeTmpRootGet.ts"])
  const violations: string[] = []
  for (const file of files) {
    if (allow.has(file) || !existsSync(file)) continue
    const contents = readFileSync(file)
    if (contents.includes(0)) continue
    if (forbidden.some((path) => contents.toString("utf8").includes(path))) violations.push(file)
  }
  expect(violations).toEqual([])
})
