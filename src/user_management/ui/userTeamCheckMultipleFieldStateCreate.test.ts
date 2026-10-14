import { expect, test } from "bun:test"
import { userTeamCheckMultipleFieldStateCreate } from "#src/user_management/ui/userTeamCheckMultipleFieldStateCreate.ts"
import type { UserTeamOption } from "#src/user_management/ui/userTeamOptionSchema.ts"
import { createSignalObject } from "#ui/utils/createSignalObject.ts"

test("userTeamCheckMultipleFieldStateCreate maps options and labels correctly", () => {
  const signal = createSignalObject<string[]>(["team-1"])
  const options: readonly UserTeamOption[] = [
    { id: "team-1", name: "Alpha Team", subtitle: "Alpha team subtitle" },
    { id: "team-2", name: "Beta Team" },
  ]

  const state = userTeamCheckMultipleFieldStateCreate({
    teamIdsSignal: () => signal,
    options: () => options,
  })

  expect(state.getOptions()).toEqual(["team-1", "team-2"])
  expect(state.valueText("team-1")).toBe("Alpha Team")
  expect(state.valueText("team-2")).toBe("Beta Team")
  expect(state.valueText("unknown-team")).toBe("unknown-team")
  expect(state.valueTextSubtitle("team-1")).toBe("Alpha team subtitle")
  expect(state.valueTextSubtitle("team-2")).toBeUndefined()
  expect(state.isDisabled()).toBe(false)
})

test("userTeamCheckMultipleFieldStateCreate respects disabled accessor", () => {
  const signal = createSignalObject<string[]>([])
  const state = userTeamCheckMultipleFieldStateCreate({
    teamIdsSignal: () => signal,
    options: () => [],
    disabled: () => true,
  })

  expect(state.isDisabled()).toBe(true)
})
