import type { Element as JSXElement } from "solid-js"

export interface MayHaveClassAndChildren {
  class?: string
  children?: JSXElement
}
