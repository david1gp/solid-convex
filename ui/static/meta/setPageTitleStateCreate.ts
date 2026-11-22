import { createEffect } from "solid-js"
import { pageTitleFormat } from "#src/app/router/pageTitleFormat.ts"

export function setPageTitleStateCreate(p: { title: () => string }) {
  createEffect(
    () => p.title(),
    (title) => {
      if (title) document.title = pageTitleFormat(title)
    },
  )

  return {}
}
