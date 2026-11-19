import { For, onSettled } from "solid-js"
import { ttt, ttt1 } from "#ui/i18n/ttt.ts"
import { Button } from "#ui/interactive/button/Button.jsx"
import { buttonVariant } from "#ui/interactive/button/buttonCva.ts"
import { themeInit, themeSet, themeSignal } from "#ui/interactive/theme/themeSignal.ts"
import { themeIcon, themeVariant, type ThemeVariant } from "#ui/interactive/theme/themeVariant.ts"
import { toastAdd } from "#ui/interactive/toast/toastAdd.ts"
import { toastVariant } from "#ui/interactive/toast/toastVariant.ts"
import { Icon } from "#ui/static/icon/Icon.jsx"

const themeOptions: ReadonlyArray<{ readonly value: ThemeVariant }> = [
  { value: themeVariant.light },
  { value: themeVariant.dark },
  { value: themeVariant.os },
]

function themeLabel(value: ThemeVariant): string {
  switch (value) {
    case themeVariant.light:
      return ttt("Light")
    case themeVariant.dark:
      return ttt("Dark")
    default:
      return ttt("System")
  }
}

/**
 * Theme switcher as an equal-width 3-button group (light/dark/OS).
 * Deliberately trackless: the active option is a subtle pill, inactive
 * options are ghost. Labels never truncate; the popover sizes intrinsically.
 */
export function AppThemeSegmentedControl() {
  onSettled(() => {
    themeInit()
  })

  const selectTheme = (value: ThemeVariant) => {
    if (themeSignal.get() === value) return
    themeSet(value, true)
    toastAdd({
      title: ttt1("Theme set: [X]", themeLabel(value)),
      icon: themeIcon(value),
      variant: toastVariant.default,
    })
  }

  return (
    <div role="group" aria-label={ttt("Appearance")} class="grid w-full grid-cols-3 gap-1">
      <For each={themeOptions}>
        {(option) => (
          <Button
            type="button"
            variant={themeSignal.get() === option.value ? buttonVariant.subtle : buttonVariant.ghost}
            aria-pressed={themeSignal.get() === option.value ? "true" : "false"}
            title={themeLabel(option.value)}
            onClick={() => selectTheme(option.value)}
            class="min-w-0 justify-center gap-1"
          >
            <Icon path={themeIcon(option.value)} class="size-4 shrink-0" />
            <span class="whitespace-nowrap">{themeLabel(option.value)}</span>
          </Button>
        )}
      </For>
    </div>
  )
}
