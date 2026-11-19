import { createEffect } from "solid-js"

export function setPageTitleStateCreate(p: { title: () => string }) {
  createEffect(() => p.title(), (title) => {
    if (title) document.title = title
  })

  return {}
}
