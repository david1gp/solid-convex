import { Toaster } from "#ui/interactive/toast/Toaster.jsx"
import { TailwindIndicator } from "#ui/static/dev/TailwindIndicator.jsx"
import { layoutWrapperDemoStateCreate } from "#ui/static/layout/layoutWrapperDemoStateCreate.js"
import type { MayHaveChildren } from "#ui/utils/MayHaveChildren.js"
import type { MayHaveTitle } from "#ui/utils/MayHaveTitle.js"

export interface LayoutWrapperDemoProps extends MayHaveChildren, MayHaveTitle {}

/** Demo layout wrapper with toaster and Tailwind indicator. */
export function LayoutWrapperDemo(p: LayoutWrapperDemoProps) {
  layoutWrapperDemoStateCreate({ title: () => p.title })
  return (
    <>
      {p.children}
      <TailwindIndicator />
      <Toaster />
    </>
  )
}
