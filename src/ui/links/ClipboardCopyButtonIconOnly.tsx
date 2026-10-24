import { mdiCheckboxMarkedOutline } from "@adaptive-ds/mdi/mdiCheckboxMarkedOutline.js"
import { mdiContentCopy } from "@adaptive-ds/mdi/mdiContentCopy.js"
import { ttc } from "#src/app/i18n/ttc.ts"
import { clipboardCopyButtonIconStateCreate } from "#src/ui/links/clipboardCopyButtonIconStateCreate.ts"
import { ButtonIconOnly } from "#ui/interactive/button/ButtonIconOnly.jsx"
import { buttonVariant } from "#ui/interactive/button/buttonCva.ts"
import type { MayHaveButtonVariant } from "#ui/utils/MayHaveButtonVariant.ts"
import type { MayHaveClass } from "#ui/utils/MayHaveClass.ts"
import type { MayHaveDisabled } from "#ui/utils/MayHaveDisabled.ts"

export interface ClipboardCopyButtonIconOnlyProps extends MayHaveButtonVariant, MayHaveClass, MayHaveDisabled {
  data: string
  copyText?: string
  toastText?: string
}

export function ClipboardCopyButtonIconOnly(p: ClipboardCopyButtonIconOnlyProps) {
  const state = clipboardCopyButtonIconStateCreate({
    data: () => p.data,
    copyText: () => p.copyText,
    toastText: () => p.toastText,
  })

  return (
    <ButtonIconOnly
      icon={state.copied.get() ? mdiCheckboxMarkedOutline : mdiContentCopy}
      iconClass="size-5"
      onClick={state.copyData}
      title={state.copied.get() ? ttc("Copied") : state.copyText()}
      disabled={p.disabled || state.copied.get()}
      variant={p.variant ?? buttonVariant.outline}
      class={p.class}
    >
      {/* {copied.get() ? ttt("Copied") : ttt("Copy")} */}
    </ButtonIconOnly>
  )
}
