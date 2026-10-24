import { createEffect } from "solid-js"

export function layoutWrapperDemoStateCreate(p: { title: () => string | undefined }) {
  createEffect(() => {
    const title = p.title()
    if (!title) return
    document.title = title
  })

  return {}
}
