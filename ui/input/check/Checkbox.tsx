import { mdiCheckboxBlankOutline } from "@adaptive-ds/mdi/mdiCheckboxBlankOutline.js"
import { mdiCheckboxMarked } from "@adaptive-ds/mdi/mdiCheckboxMarked.js"
import { omit } from "solid-js"
import { classesDisabledDirectly } from "#ui/classes/classesDisabledDirectly.js"
import { Icon } from "#ui/static/icon/Icon.jsx"
import { cn } from "cn"
import type { MayHaveChildren } from "#ui/utils/MayHaveChildren.js"
import type { MayHaveClass } from "#ui/utils/MayHaveClass.js"
import type { MayHaveDisabled } from "#ui/utils/MayHaveDisabled.js"
import { type ComponentProps } from "@solidjs/web"

interface CheckboxProps extends MayHaveClass, MayHaveChildren, MayHaveDisabled, ComponentProps<"checkbox"> {
  id?: string
  checked: boolean
  onChange: (checked: boolean) => void
}

/** Accessible labeled checkbox driven by a controlled `checked`/`onChange` pair. */
export function Checkbox(p: CheckboxProps) {
  const rest = omit(p, "id", "checked", "onChange", "disabled", "class", "children")
  return (
    <label
      class={cn(
        "flex items-start gap-1 cursor-pointer",
        p.disabled && classesDisabledDirectly, // disabled state
        p.class,
      )}
    >
      <input
        id={p.id}
        type="checkbox"
        checked={p.checked}
        onChange={(e) => p.onChange(e.currentTarget.checked)}
        class="peer sr-only"
        disabled={p.disabled}
        aria-describedby={p.id ? `${p.id}-error` : undefined}
        {...rest}
      />
      <span
        aria-hidden="true"
        class="flex size-6 shrink-0 items-center justify-center rounded-sm peer-focus-visible:ring-2 peer-focus-visible:ring-ring"
      >
        <Icon path={p.checked ? mdiCheckboxMarked : mdiCheckboxBlankOutline} class="size-6 text-current" />
      </span>
      <span id={p.id ? `${p.id}-label` : undefined}>{p.children}</span>
    </label>
  )
}
