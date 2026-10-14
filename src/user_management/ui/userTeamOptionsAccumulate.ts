import type { UserTeamOption } from "#src/user_management/ui/userTeamOptionSchema.ts"

interface UserTeamOptionsAccumulateInput {
  existingOptions: readonly UserTeamOption[]
  incomingPage: readonly { teamId: string; name: string; orgId: string }[]
  orgMap: ReadonlyMap<string, string>
  selectedTeamIds: readonly string[]
}

export function userTeamOptionsAccumulate(input: UserTeamOptionsAccumulateInput): readonly UserTeamOption[] {
  const optionMap = new Map<string, UserTeamOption>()

  for (const opt of input.existingOptions) {
    optionMap.set(opt.id, opt)
  }

  for (const team of input.incomingPage) {
    const orgLabel = input.orgMap.get(team.orgId)
    optionMap.set(team.teamId, {
      id: team.teamId,
      name: team.name,
      subtitle: orgLabel ? `Org: ${orgLabel}` : undefined,
    })
  }

  for (const id of input.selectedTeamIds) {
    if (!optionMap.has(id)) {
      optionMap.set(id, {
        id,
        name: `Team (${id})`,
        subtitle: "Existing assignment",
      })
    }
  }

  return Array.from(optionMap.values())
}
