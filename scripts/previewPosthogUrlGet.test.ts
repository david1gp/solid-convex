import { expect, test } from "bun:test"
import { previewPosthogUrlGet } from "./previewPosthogUrlGet"

test("PostHog proxy keeps even double-slash paths on the fixed upstream", () => {
  const target = previewPosthogUrlGet(new URL("https://preview.test/ph-api//example.com/path?q=1"))
  expect(target.origin).toBe("https://eu.i.posthog.com")
  expect(target.pathname).toBe("//example.com/path")
  expect(target.search).toBe("?q=1")
  expect(previewPosthogUrlGet(new URL("https://preview.test/ph-ui/static/app.js")).origin).toBe(
    "https://eu-assets.i.posthog.com",
  )
})
