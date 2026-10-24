import { layoutWrapperConvexStateCreate } from "#src/app/layout/layoutWrapperConvexStateCreate.ts"
import { ConvexContext } from "#src/utils/convex_client/convexContext.ts"
import { Toaster } from "#ui/interactive/toast/Toaster.jsx"
import { TailwindIndicator } from "#ui/static/dev/TailwindIndicator.jsx"
import type { HasChildren } from "#ui/utils/HasChildren.ts"
import type { MayHaveTitle } from "#ui/utils/MayHaveTitle.ts"

export interface LayoutWrapperConvexProps extends HasChildren, MayHaveTitle {}

export function LayoutWrapperConvex(p: LayoutWrapperConvexProps) {
  const state = layoutWrapperConvexStateCreate({ title: () => p.title })
  const convex = state.convex()
  if (!convex) return null
  return (
    <>
      <ConvexContext.Provider value={convex}>{p.children}</ConvexContext.Provider>
      <TailwindIndicator />
      <Toaster />
    </>
  )
}
