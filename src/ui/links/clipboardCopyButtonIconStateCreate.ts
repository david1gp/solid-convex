import { ttc } from "#src/app/i18n/ttc.ts"
import { toastAdd } from "#ui/interactive/toast/toastAdd.ts"
import { toastVariant } from "#ui/interactive/toast/toastVariant.ts"
import { createSignalObject } from "#ui/utils/createSignalObject.ts"

export function clipboardCopyButtonIconStateCreate(p: {
  data: () => string
  copyText?: () => string | undefined
  toastText?: () => string | undefined
}) {
  const copied = createSignalObject(false)
  const copyText = () => p.copyText?.() ?? ttc("Copy to clipboard")
  const toastText = () => p.toastText?.() ?? ttc("Copied to clipboard")

  function copyData() {
    navigator.clipboard.writeText(p.data()).then(
      () => {
        copied.set(true)
        toastAdd({
          title: toastText(),
          variant: toastVariant.success,
        })
        // Reset the copied state after 2 seconds
        setTimeout(() => {
          copied.set(false)
        }, 2000)
      },
      (err) => {
        console.error("clipboard: could not copy text: ", err)
        const errorTitle = ttc("Copy failed")
        toastAdd({
          title: errorTitle,
          variant: toastVariant.error,
          description: err.message || ttc("Unable to copy to clipboard"),
        })
      },
    )
  }

  return { copied, copyText, toastText, copyData }
}
