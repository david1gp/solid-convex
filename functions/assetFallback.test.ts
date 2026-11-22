import { expect, test } from "bun:test"
import { onRequest } from "./assets/[[path]].js"

test("missing assets do not return the SPA document", async () => {
  const response = await onRequest({
    next: async () => new Response("<html>", { headers: { "content-type": "text/html; charset=utf-8" } }),
  })
  expect(response.status).toBe(404)
  expect(response.headers.get("cache-control")).toBe("no-store")
})

test("existing assets retain their response", async () => {
  const asset = new Response("code", { headers: { "content-type": "text/javascript" } })
  const response = await onRequest({
    next: async () => asset,
  })
  expect(response).toBe(asset)
})
