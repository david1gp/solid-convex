import { mdiClose } from "@adaptive-ds/mdi/mdiClose.js"
import Dialog from "@corvu-next/dialog"
import { type Component, omit } from "solid-js"
import { classesDisabledDirectly } from "#ui/classes/classesDisabledDirectly.js"
import { type ButtonCvaProps, buttonCvaIconOnly, buttonVariant } from "#ui/interactive/button/buttonCva.js"
import { buttonIconCva } from "#ui/interactive/button/buttonIconCva.js"
import { classesButtonClickAnimation } from "#ui/interactive/button/classesButtonClickAnimation.js"
import type { CorcuDialogTexts } from "#ui/interactive/dialog/CorcuDialogTexts.js"
import { corvuDialogTextDefault } from "#ui/interactive/dialog/CorcuDialogTexts.js"
import { classesDialogContentMerge, classesDialogOverlayMerge } from "#ui/interactive/dialog/classesDialogContent.js"
import { Icon } from "#ui/static/icon/Icon.jsx"
import { cn } from "cn"
import type { HasIcon } from "#ui/utils/HasIcon.js"
import type { HasTitle } from "#ui/utils/HasTitle.js"
import type { MayHaveChildren } from "#ui/utils/MayHaveChildren.js"
import type { MayHaveClass } from "#ui/utils/MayHaveClass.js"
import type { MayHaveInnerClass } from "#ui/utils/MayHaveInnerClass.js"
import { isLoading, type MayHaveIsLoading } from "#ui/utils/MayHaveIsLoading.js"
import { type ComponentProps } from "@solidjs/web"

export interface CorvuDialogIconProps
  extends Omit<ComponentProps<"button">, "title">,
    ButtonCvaProps,
    HasIcon,
    HasTitle,
    MayHaveClass,
    MayHaveInnerClass,
    MayHaveChildren,
    MayHaveIsLoading {
  dialogTitle: string
  description?: string
  titleClass?: string
  descriptionClass?: string
  texts?: CorcuDialogTexts
}

/** Modal dialog opened by an icon-only trigger. */
export const CorvuDialogIcon: Component<CorvuDialogIconProps> = (p) => {
  const rest = omit(
    p,
    "variant",
    "class",
    "isLoading",
    "disabled",
    "title",
    "icon",
    "iconClass",
    "innerClass",
    "children",
    "dialogTitle",
    "description",
    "titleClass",
    "descriptionClass",
    "texts",
  )

  const texts = p.texts ?? corvuDialogTextDefault

  return (
    <Dialog>
      <Dialog.Trigger
        class={buttonCvaIconOnly(p.variant, isLoading(p), p.disabled, classesButtonClickAnimation, p.class)}
        title={p.title}
        {...rest}
      >
        <Icon
          path={p.icon}
          class={buttonIconCva(
            p.variant,
            isLoading(p) && "animate-spin-faster",
            p.disabled && classesDisabledDirectly,
            p.iconClass,
          )}
        />
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay class={classesDialogOverlayMerge()} />
        <Dialog.Content class={classesDialogContentMerge(p.innerClass)}>
          <header class="flex items-start justify-between mb-4">
            <div>
              <Dialog.Label class={cn("text-lg font-semibold", p.titleClass)}>{p.dialogTitle}</Dialog.Label>
              {p.description && (
                <Dialog.Description class={cn("text-muted-foreground", p.descriptionClass)}>
                  {p.description}
                </Dialog.Description>
              )}
            </div>
            <Dialog.Close class={buttonCvaIconOnly(buttonVariant.outline, false, false)} title={texts.closeDialog}>
              <Icon path={mdiClose} class={buttonIconCva(buttonVariant.outline, "")} />
            </Dialog.Close>
          </header>
          {p.children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  )
}
