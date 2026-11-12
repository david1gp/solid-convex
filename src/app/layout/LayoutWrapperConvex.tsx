import { useLocation } from "@tanstack/solid-router"
import { Show } from "solid-js"
import { layoutWrapperConvexStateCreate } from "#src/app/layout/layoutWrapperConvexStateCreate.ts"
import { ConvexContext } from "#src/utils/convex_client/convexContext.ts"
import { Toaster } from "#ui/interactive/toast/Toaster.jsx"
import { TailwindIndicator } from "#ui/static/dev/TailwindIndicator.jsx"
import type { HasChildren } from "#ui/utils/HasChildren.ts"
import type { MayHaveTitle } from "#ui/utils/MayHaveTitle.ts"

export interface LayoutWrapperConvexProps extends HasChildren, MayHaveTitle {}

/** Hides the dev breakpoint badge on demo routes and `?shot` screenshot runs. */
export function tailwindIndicatorHidden(pathname: string, search: Record<string, unknown>): boolean {
  return pathname.startsWith("/demos") || "shot" in search
}

export function LayoutWrapperConvex(p: LayoutWrapperConvexProps) {
  const state = layoutWrapperConvexStateCreate({ title: () => p.title })
  const location = useLocation()
  const convex = state.convex()
  if (!convex) return null
  return (
    <>
      <ConvexContext.Provider value={convex}>{p.children}</ConvexContext.Provider>
      <Show when={!tailwindIndicatorHidden(location().pathname, location().search as Record<string, unknown>)}>
        <TailwindIndicator />
      </Show>
      <Toaster />
    </>
  )
}
