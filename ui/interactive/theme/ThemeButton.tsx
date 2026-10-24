import { ButtonIconOnly } from "#ui/interactive/button/ButtonIconOnly.jsx"
import { buttonVariant } from "#ui/interactive/button/buttonCva.js"
import type { ThemeButtonText } from "#ui/interactive/theme/ThemeButtonText.js"
import { themeButtonStateCreate } from "#ui/interactive/theme/themeButtonStateCreate.js"
import { classMerge } from "#ui/utils/classMerge.js"
import type { MayHaveClass } from "#ui/utils/MayHaveClass.js"

export interface ThemeButtonProps extends MayHaveClass {
  showText?: boolean
  texts?: ThemeButtonText
}

/** Button cycling through the color theme. */
export function ThemeButton(p: ThemeButtonProps) {
  const state = themeButtonStateCreate({ texts: () => p.texts })

  return (
    <ButtonIconOnly
      title={state.title()}
      icon={state.icon()}
      variant={buttonVariant.ghost}
      class={classMerge(p.showText && "min-w-24", p.class)}
      onClick={state.rotate}
    >
      {p.showText && state.themeReady() && state.label()}
    </ButtonIconOnly>
  )
}
