import { setPageTitleStateCreate } from "#ui/static/meta/setPageTitleStateCreate.js"

export type SetPageTitleProps = {
  title: string
}

/** Sets the document title; renders nothing. */
export function SetPageTitle(p: SetPageTitleProps) {
  setPageTitleStateCreate({ title: () => p.title })
  return null
}
