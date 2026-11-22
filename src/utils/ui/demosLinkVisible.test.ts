import { expect, test } from "bun:test"
import { demosLinkVisible } from "./demosLinkVisible.ts"

test("demos are visible in preview and development but not production", () => {
  for (const mode of ["preview", "development", "test", undefined]) expect(demosLinkVisible(mode)).toBe(true)
  expect(demosLinkVisible("production")).toBe(false)
})
