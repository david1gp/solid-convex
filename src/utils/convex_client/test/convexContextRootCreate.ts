import type { ConvexClient } from "convex/browser"
import { createComponent, createRenderEffect, createRoot, getOwner, runWithOwner, type Owner } from "solid-js"
import { ConvexContext } from "../convexContext.ts"

/** Run a test inside a real Solid context provider and return its callback's result. */
export function convexContextRootCreate<T>(client: unknown, fn: (dispose: () => void) => T): T {
  return createRoot((dispose) => {
    let providerOwner!: Owner
    const children = createComponent(ConvexContext, {
      value: client as ConvexClient,
      get children() {
        providerOwner = getOwner()!
        return undefined
      },
    })
    // Keep the lazy provider observed: otherwise Solid disposes its child owner.
    createRenderEffect(
      () => (children as () => unknown)(),
      () => {},
    )
    // Run outside the provider memo so tests can flush while preserving its context.
    return runWithOwner(providerOwner, () => fn(dispose))
  })
}
