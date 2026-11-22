import { afterEach, expect, mock, test } from "bun:test"
import { onRequest as apiRequest } from "./ph-api/[[path]].js"
import { onRequest as uiRequest } from "./ph-ui/[[path]].js"

const originalFetch = globalThis.fetch

afterEach(() => {
  globalThis.fetch = originalFetch
})

test("Pages PostHog proxies keep double-slash paths on their configured upstream", async () => {
  const fetchMock = mock(() => Promise.resolve(new Response("ok")))
  globalThis.fetch = fetchMock as typeof fetch
  await apiRequest({ request: new Request("https://site.example/ph-api//evil.example/x?q=1") })
  await uiRequest({ request: new Request("https://site.example/ph-ui//evil.example/x") })
  expect(String(fetchMock.mock.calls[0]?.[0])).toBe("https://eu.i.posthog.com//evil.example/x?q=1")
  expect(String(fetchMock.mock.calls[1]?.[0])).toBe("https://eu-assets.i.posthog.com//evil.example/x")
})
