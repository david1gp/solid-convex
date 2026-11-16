import { Show } from "solid-js"
import { userTeamCheckMultipleFieldStateCreate } from "#src/user_management/ui/userTeamCheckMultipleFieldStateCreate.ts"
import type { UserTeamOption } from "#src/user_management/ui/userTeamOptionSchema.ts"
import { CheckMultiple } from "#ui/input/check/CheckMultiple.tsx"
import { Label } from "#ui/input/label/Label.jsx"
import { cn } from "cn"
import type { SignalObject } from "#ui/utils/createSignalObject.ts"
import type { MayHaveClass } from "#ui/utils/MayHaveClass.ts"
import type { MayHaveDisabled } from "#ui/utils/MayHaveDisabled.ts"
import type { MayHaveId } from "#ui/utils/MayHaveId.ts"

interface UserTeamCheckMultipleFieldProps extends MayHaveClass, MayHaveDisabled, MayHaveId {
  teamIdsSignal: SignalObject<string[]>
  options: readonly UserTeamOption[]
  label?: string
  subtitle?: string
}

export function UserTeamCheckMultipleField(props: UserTeamCheckMultipleFieldProps) {
  const state = userTeamCheckMultipleFieldStateCreate({
    teamIdsSignal: () => props.teamIdsSignal,
    options: () => props.options,
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
      <CheckMultiple<string>
        id={props.id}
        valueSignal={state.teamIdsSignal()}
        getOptions={state.getOptions}
        valueText={state.valueText}
        valueTextSubtitle={state.valueTextSubtitle}
        disabled={state.isDisabled()}
      />
    </div>
  )
}
