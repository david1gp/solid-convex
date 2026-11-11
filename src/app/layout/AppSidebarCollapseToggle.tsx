import { mdiChevronLeft } from "@adaptive-ds/mdi/mdiChevronLeft.js"
import { mdiChevronRight } from "@adaptive-ds/mdi/mdiChevronRight.js"
import { ttt } from "#ui/i18n/ttt.ts"
import { ButtonIcon } from "#ui/interactive/button/ButtonIcon.jsx"
import { buttonVariant } from "#ui/interactive/button/buttonCva.ts"
import { Icon } from "#ui/static/icon/Icon.jsx"
import { classMerge } from "#ui/utils/classMerge.ts"
import type { MayHaveClass } from "#ui/utils/MayHaveClass.ts"

export interface AppSidebarCollapseToggleProps extends MayHaveClass {
  readonly collapsed: () => boolean
  readonly onToggle: () => void
}

/** Desktop toggle switching the app sidebar between expanded and icon rail. */
export function AppSidebarCollapseToggle(p: AppSidebarCollapseToggleProps) {
  const label = () => (p.collapsed() ? ttt("Expand sidebar") : ttt("Collapse sidebar"))
  return (
    <ButtonIcon
      variant={buttonVariant.ghost}
      onClick={p.onToggle}
      aria-label={label()}
      title={label()}
      aria-expanded={!p.collapsed()}
      class={classMerge("shrink-0", p.class)}
    >
      <Icon path={p.collapsed() ? mdiChevronRight : mdiChevronLeft} class="size-5" />
    </ButtonIcon>
  )
}
