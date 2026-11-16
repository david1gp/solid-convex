import { Show } from "solid-js"
import type { UserRole } from "#src/auth/model_field/userRole.ts"
import { userRoleCheckMultipleFieldStateCreate } from "#src/user_management/ui/userRoleCheckMultipleFieldStateCreate.ts"
import { CheckMultiple } from "#ui/input/check/CheckMultiple.tsx"
import { Label } from "#ui/input/label/Label.jsx"
import { cn } from "cn"
import type { SignalObject } from "#ui/utils/createSignalObject.ts"
import type { MayHaveClass } from "#ui/utils/MayHaveClass.ts"
import type { MayHaveDisabled } from "#ui/utils/MayHaveDisabled.ts"
import type { MayHaveId } from "#ui/utils/MayHaveId.ts"

interface UserRoleCheckMultipleFieldProps extends MayHaveClass, MayHaveDisabled, MayHaveId {
  rolesSignal: SignalObject<UserRole[]>
  label?: string
  subtitle?: string
}

export function UserRoleCheckMultipleField(props: UserRoleCheckMultipleFieldProps) {
  const state = userRoleCheckMultipleFieldStateCreate({
    rolesSignal: () => props.rolesSignal,
    disabled: () => props.disabled,
  })

  return (
    <div class={cn("flex flex-col gap-2", props.class)}>
      <Show when={props.label}>
        <Label for={props.id}>{props.label}</Label>
      </Show>
      <Show when={props.subtitle}>
        <p class="text-xs text-muted-foreground">{props.subtitle}</p>
      </Show>
      <CheckMultiple<UserRole>
        id={props.id}
        valueSignal={state.rolesSignal()}
        getOptions={state.getOptions}
        valueText={state.valueText}
        valueTextSubtitle={state.valueTextSubtitle}
        disabled={state.isDisabled()}
      />
    </div>
  )
}
