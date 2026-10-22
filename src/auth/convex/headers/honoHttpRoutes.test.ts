import { expect, test } from "bun:test"
import type { ActionCtx } from "#convex/_generated/server.js"
import { addHttpRoutesAuth } from "#src/auth/convex/addHttpRoutesAuth.ts"
import { addRouteWithCors } from "#src/auth/convex/headers/cors/addRouteWithCors.ts"
import { createHonoDispatcher } from "#src/auth/convex/headers/createHonoDispatcher.ts"
import { addHttpRoutesR2 } from "#src/r2/convex/addHttpRoutesR2.ts"
import { addHttpRoutesResource } from "#src/resource/convex/addHttpRoutesResource.ts"

test("Hono dispatcher passes the Convex action context to a route", async () => {
  const dispatcher = createHonoDispatcher()
  const actionCtx = {} as ActionCtx

  addRouteWithCors(dispatcher, "/api/test", "GET", async (ctx) => {
    expect(ctx).toBe(actionCtx)
    return new Response("ok")
  })

  const response = await dispatcher.fetch(new Request("https://example.com/api/test"), actionCtx)

  expect(response.status).toBe(200)
  expect(await response.text()).toBe("ok")
  expect(response.headers.get("Access-Control-Allow-Methods")).toBe("OPTIONS, GET, POST")

  const preflightResponse = await dispatcher.fetch(
    new Request("https://example.com/api/test", { method: "OPTIONS" }),
    actionCtx,
  )
  expect(preflightResponse.status).toBe(200)
  expect(preflightResponse.headers.get("Access-Control-Allow-Headers")).toBe(
    "Authorization, If-Modified-Since, Content-Type",
  )
  expect(preflightResponse.headers.get("Server-Timing")).toStartWith("returnCorsPreflightResponse;dur=")
})

test("Hono dispatcher keeps the existing HTTP route surface", () => {
  const dispatcher = createHonoDispatcher()
  addHttpRoutesAuth(dispatcher)
  addHttpRoutesResource(dispatcher)
  addHttpRoutesR2(dispatcher)

  const routeKeys = new Set(dispatcher.routes.map((route) => `${route.method} ${route.path}`))
  const expectedRoutes = [
    "GET /api/auth/github",
    "GET /api/auth/google",
    "GET /api/auth/oidc/start",
    "GET /api/auth/oidc/callback",
    "GET /api/auth/oidc/authworks/start",
    "GET /api/auth/oidc/authworks/callback",
    "GET /api/auth/admin",
    "POST /api/auth/sign-up",
    "POST /api/auth/sign-up-confirm-email",
    "POST /api/auth/sign-in-via-pw",
    "POST /api/auth/sign-in-via-email",
    "POST /api/auth/sign-in-via-email-enter-otp",
    "POST /api/auth/profile-update",
    "POST /api/auth/password-change-request",
    "POST /api/auth/password-change-confirm",
    "POST /api/auth/email-change-request",
    "POST /api/auth/email-change-confirm",
    "POST /api/auth/user-delete",
    "GET /api/isOnline",
    "GET /api/resource/list",
    "GET /api/resource/get",
    "GET /api/r2/uploadUrl",
    "POST /api/r2/fileCreate",
  ]

  for (const route of expectedRoutes) {
    expect(routeKeys.has(route)).toBe(true)
    const optionsRoute = route.replace(/^(GET|POST) /, "OPTIONS ")
    expect(routeKeys.has(optionsRoute)).toBe(true)
  }

  expect(routeKeys.has("GET /api/auth/dev")).toBe(false)
  expect(routeKeys.has("OPTIONS /api/auth/dev")).toBe(false)

  expect(routeKeys.size).toBe(expectedRoutes.length * 2)
})
