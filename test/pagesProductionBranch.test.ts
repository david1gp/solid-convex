import { expect, test } from "bun:test"
import packageJson from "../package.json" with { type: "json" }

test("Pages uploads target the production branch from detached worktrees", () => {
  expect(packageJson.scripts["frontend:upload"]).toMatch(/--branch(?:=|\s+)main(?:\s|$)/)
})
