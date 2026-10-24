import { createEffect } from "solid-js"

export function setPageTitleStateCreate(p: { title: () => string }) {
  createEffect(() => {
    const title = p.title()
    if (!title) return
    document.title = title
  })

  return {}
}
