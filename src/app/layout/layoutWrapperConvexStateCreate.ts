import { ConvexClient } from "convex/browser"
import { createEffect } from "solid-js"
import { envBaseUrlConvexResult } from "#src/app/env/public/envBaseUrlConvexResult.ts"

export function layoutWrapperConvexStateCreate(p: { title: () => string | undefined }) {
  const baseUrlResult = envBaseUrlConvexResult()
  if (!baseUrlResult.success) {
    console.error("!envBaseUrlConvex")
    return { convex: () => null as ConvexClient | null }
  }
  const convex = new ConvexClient(baseUrlResult.data, { unsavedChangesWarning: false })
  createEffect(
    () => p.title(),
    (title) => {
      if (!title) return
      document.title = title
    },
  )
  return { convex: () => convex as ConvexClient | null }
}
