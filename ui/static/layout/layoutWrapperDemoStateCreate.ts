import { createEffect } from "solid-js"

export function layoutWrapperDemoStateCreate(p: { title: () => string | undefined }) {
  createEffect(() => p.title(), (title) => {
    if (title) document.title = title
  })

  return {}
}
