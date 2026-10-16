import { ConvexClient } from "convex/browser"
import { createEffect } from "solid-js"
import { envBaseUrlConvexResult } from "#src/app/env/public/envBaseUrlConvexResult.ts"
import { ConvexContext } from "#src/utils/convex_client/convexContext.ts"
import { Toaster } from "#ui/interactive/toast/Toaster.jsx"
import { TailwindIndicator } from "#ui/static/dev/TailwindIndicator.jsx"
import type { HasChildren } from "#ui/utils/HasChildren.ts"
import type { MayHaveTitle } from "#ui/utils/MayHaveTitle.ts"

export interface LayoutWrapperConvexProps extends HasChildren, MayHaveTitle {}

export function LayoutWrapperConvex(p: LayoutWrapperConvexProps) {
  const baseUrlResult = envBaseUrlConvexResult()
  if (!baseUrlResult.success) {
    console.error("!envBaseUrlConvex")
    return null
  }
  const convex = new ConvexClient(baseUrlResult.data, { unsavedChangesWarning: false })
  createEffect(() => {
    if (!p.title) return
    document.title = p.title
  })
  return (
    <>
      <ConvexContext.Provider value={convex}>{p.children}</ConvexContext.Provider>
      <TailwindIndicator />
      <Toaster />
    </>
  )
}
