import { useLocation } from "@tanstack/solid-router"
import { Show } from "solid-js"
import { Toaster } from "#ui/interactive/toast/Toaster.jsx"
import { TailwindIndicator } from "#ui/static/dev/TailwindIndicator.jsx"
import { layoutWrapperDemoStateCreate } from "#ui/static/layout/layoutWrapperDemoStateCreate.js"
import type { MayHaveChildren } from "#ui/utils/MayHaveChildren.js"
import type { MayHaveTitle } from "#ui/utils/MayHaveTitle.js"

export interface LayoutWrapperDemoProps extends MayHaveChildren, MayHaveTitle {}

/** Demo layout wrapper with toaster and Tailwind indicator (hidden on `/demos*` and `?shot` screenshot runs). */
export function LayoutWrapperDemo(p: LayoutWrapperDemoProps) {
  layoutWrapperDemoStateCreate({ title: () => p.title })
  const location = useLocation()
  const hidden = () =>
    location().pathname.startsWith("/demos") || "shot" in (location().search as Record<string, unknown>)
  return (
    <>
      {p.children}
      <Show when={!hidden()}>
        <TailwindIndicator />
      </Show>
      <Toaster />
    </>
  )
}
