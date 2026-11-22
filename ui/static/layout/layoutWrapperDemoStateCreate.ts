import { createEffect } from "solid-js"
import { pageTitleFormat } from "#src/app/router/pageTitleFormat.ts"

export function layoutWrapperDemoStateCreate(p: { title: () => string | undefined }) {
  createEffect(() => p.title(), (title) => {
    if (title) document.title = pageTitleFormat(title)
  })

  return {}
}
