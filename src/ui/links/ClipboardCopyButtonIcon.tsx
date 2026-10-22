import { mdiCheckboxMarkedOutline } from "@adaptive-ds/mdi/mdiCheckboxMarkedOutline.js"
import { mdiContentCopy } from "@adaptive-ds/mdi/mdiContentCopy.js"
import { ttc } from "#src/app/i18n/ttc.ts"
import { ButtonIcon } from "#ui/interactive/button/ButtonIcon.jsx"
import { buttonVariant } from "#ui/interactive/button/buttonCva.ts"
import type { MayHaveButtonVariant } from "#ui/utils/MayHaveButtonVariant.ts"
import type { MayHaveChildren } from "#ui/utils/MayHaveChildren.ts"
import type { MayHaveClass } from "#ui/utils/MayHaveClass.ts"
import type { MayHaveDisabled } from "#ui/utils/MayHaveDisabled.ts"
import { clipboardCopyButtonIconStateCreate } from "#src/ui/links/clipboardCopyButtonIconStateCreate.ts"

export interface ClipboardCopyButtonIconProps
  extends MayHaveButtonVariant,
    MayHaveClass,
    MayHaveDisabled,
    MayHaveChildren {
  data: string
  copyText?: string
  toastText?: string
}

export function ClipboardCopyButtonIcon(p: ClipboardCopyButtonIconProps) {
  const state = clipboardCopyButtonIconStateCreate({
    data: () => p.data,
    copyText: () => p.copyText,
    toastText: () => p.toastText,
  })

  return (
    <ButtonIcon
      icon={state.copied.get() ? mdiCheckboxMarkedOutline : mdiContentCopy}
      onClick={state.copyData}
      title={state.copied.get() ? ttc("Copied") : state.copyText()}
      disabled={p.disabled || state.copied.get()}
      variant={p.variant ?? buttonVariant.outline}
      class={p.class}
    >
      {/* {copied.get() ? ttt("Copied") : ttt("Copy")} */}
      {p.children}
    </ButtonIcon>
  )
}
