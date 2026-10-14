import type { UserTeamOption } from "#src/user_management/ui/userTeamOptionSchema.ts"
import type { SignalObject } from "#ui/utils/createSignalObject.ts"

interface UserTeamCheckMultipleFieldStateProps {
  teamIdsSignal: () => SignalObject<string[]>
  options: () => readonly UserTeamOption[]
  disabled?: () => boolean | undefined
}

export function userTeamCheckMultipleFieldStateCreate(props: UserTeamCheckMultipleFieldStateProps) {
  const getOptions = (): string[] => props.options().map((option) => option.id)

  const valueText = (teamId: string): string => {
    const match = props.options().find((option) => option.id === teamId)
    return match?.name ?? teamId
  }

  const valueTextSubtitle = (teamId: string): string | undefined => {
    const match = props.options().find((option) => option.id === teamId)
    return match?.subtitle
  }

  return {
    teamIdsSignal: props.teamIdsSignal,
    getOptions,
    valueText,
    valueTextSubtitle,
    isDisabled: () => props.disabled?.() ?? false,
  }
}
