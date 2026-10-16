import { mdiArrowLeft } from "@adaptive-ds/mdi/mdiArrowLeft.js"
import { mdiArrowRight } from "@adaptive-ds/mdi/mdiArrowRight.js"
import { type Accessor, Show } from "solid-js"
import { ttc } from "#src/app/i18n/ttc.ts"
import { ButtonIcon } from "#ui/interactive/button/ButtonIcon.jsx"
import { buttonSize, buttonVariant } from "#ui/interactive/button/buttonCva.ts"
import { classMerge } from "#ui/utils/classMerge.ts"
import type { MayHaveClass } from "#ui/utils/MayHaveClass.ts"

interface PaginationControlsProps extends MayHaveClass {
  page: Accessor<number>
  canPrevious: Accessor<boolean>
  canNext: Accessor<boolean>
  previous: () => void
  next: () => void
  loading?: Accessor<boolean>
}

export function PaginationControls(p: PaginationControlsProps) {
  return (
    <Show when={p.loading?.() || p.canPrevious() || p.canNext()} fallback={null}>
      <div class={classMerge("flex items-center justify-center gap-2", p.class)}>
        <ButtonIcon
          icon={mdiArrowLeft}
          variant={buttonVariant.subtle}
          size={buttonSize.sm}
          onClick={p.previous}
          disabled={p.loading?.() || !p.canPrevious()}
        >
          {ttc("Previous")}
        </ButtonIcon>
        <span class="text-sm text-muted-foreground" aria-live="polite">
          {ttc("Page")} {p.page()}
        </span>
        <ButtonIcon
          iconRight={mdiArrowRight}
          variant={buttonVariant.subtle}
          size={buttonSize.sm}
          onClick={p.next}
          disabled={p.loading?.() || !p.canNext()}
        >
          {ttc("Next")}
        </ButtonIcon>
      </div>
    </Show>
  )
}
