import { mdiArrowLeft } from "@adaptive-ds/mdi/mdiArrowLeft.js"
import { omit } from "solid-js"
import { ttc } from "#src/app/i18n/ttc.ts"
import { ButtonIcon, type ButtonIconProps } from "#ui/interactive/button/ButtonIcon.jsx"
import { buttonVariant } from "#ui/interactive/button/buttonCva.ts"

export function GoBackLinkButton(p: Omit<ButtonIconProps, "href" | "onClick">) {
  const rest = omit(p, "icon", "children", "variant")
  return (
    <ButtonIcon
      icon={p.icon ?? mdiArrowLeft}
      onClick={() => {
        history.back()
      }}
      variant={p.variant ?? buttonVariant.outline}
      {...rest}
    >
      {ttc("Go back")}
    </ButtonIcon>
  )
}
