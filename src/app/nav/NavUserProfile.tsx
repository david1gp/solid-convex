import { omit } from "solid-js"
import { NavCrumbs } from "#src/app/nav/NavCrumbs.tsx"
import type { MayHaveClass } from "#ui/utils/MayHaveClass.ts"
import { type JSX } from "@solidjs/web"

export interface NavUserProfileProps extends MayHaveClass {
  childrenLeft: JSX.Element
  children?: JSX.Element
  childrenRight?: JSX.Element
}

export function NavUserProfile(p: NavUserProfileProps) {
  const rest = omit(p, "childrenLeft", "children", "childrenRight")
  return (
    <NavCrumbs {...rest}>
      {p.childrenLeft}
      {p.children ?? p.childrenRight}
    </NavCrumbs>
  )
}
