import type { BrowserContext, Page } from "playwright"

export function pageErrorGuardCreate(context: BrowserContext) {
  const errors: Error[] = []
  const pages = new Set<Page>()
  const recordError = (error: Error) => errors.push(error)
  const watchPage = (page: Page) => {
    if (pages.has(page)) return
    pages.add(page)
    page.on("pageerror", recordError)
  }

  context.on("page", watchPage)
  for (const page of context.pages()) watchPage(page)

  return {
    finish() {
      context.off("page", watchPage)
      for (const page of pages) page.off("pageerror", recordError)
      if (errors.length > 0) {
        throw new AggregateError(errors, `Uncaught browser page errors (${errors.length})`)
      }
    },
  }
}
