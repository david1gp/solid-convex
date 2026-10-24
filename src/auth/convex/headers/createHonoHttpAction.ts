import { httpAction } from "#convex/_generated/server.js"
import type { HonoDispatcher } from "#src/auth/convex/headers/honoDispatcher.ts"

export function createHonoHttpAction(dispatcher: HonoDispatcher) {
  return httpAction(async (ctx, request) => {
    const op = "honoHttpAction"
    const method = request.method
    const path = new URL(request.url).pathname
    console.info(op, { method, path })
    try {
      const response = await dispatcher.fetch(request, ctx)
      console.info(op, { method, path, status: response.status })
      return response
    } catch (err) {
      console.error(op, { method, path, err })
      throw err
    }
  })
}
