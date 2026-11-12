import { useNavigate } from "@tanstack/solid-router"
import * as a from "valibot"
import type { Team } from "#src/team/model/teamSchema.ts"
import { teamDataSchema } from "#src/team/model/teamDataSchema.ts"
import { teamPageDemoFixturesGet } from "#src/team/ui/demo/teamPageDemoFixturesGet.ts"
import { teamPageDemoHref } from "#src/team/ui/demo/teamPageDemoHref.ts"
import { teamFormStateCreate } from "#src/team/ui/teamFormStateCreate.ts"
import { formFieldConfigs } from "#src/ui/form/formFieldConfigs.ts"
import { formMode } from "#ui/input/form/formMode.ts"
import { createSignalObject } from "#ui/utils/createSignalObject.ts"

/** Local-only team form state: same interface as the real form, no Convex or storage. */
export function teamFormDemoStateCreate(
  orgHandle: () => string | undefined,
  team: () => Team | undefined,
): ReturnType<typeof teamFormStateCreate> {
  const navigate = useNavigate()
  const fixtures = teamPageDemoFixturesGet()
  const name = createSignalObject(team()?.name ?? "")
  const description = createSignalObject(team()?.description ?? "")
  const error = createSignalObject("")
  const busy = createSignalObject(false)

  const submit = async (event: SubmitEvent) => {
    event.preventDefault()
    if (busy.get()) return
    const parsed = a.safeParse(teamDataSchema, {
      name: name.get().trim(),
      description: description.get().trim() || undefined,
    })
    if (!parsed.success) {
      error.set(a.summarize(parsed.issues))
      return
    }
    const current = team()
    if (!current && !orgHandle()) {
      error.set("Choose an organization before creating a team.")
      return
    }
    busy.set(true)
    error.set("")
    try {
      const saved = current ? (fixtures.edit(current.teamId, parsed.output) ?? current) : fixtures.add(parsed.output)
      await navigate({
        to: teamPageDemoHref("detail", { orgHandle: orgHandle(), teamId: saved.teamId }),
      })
    } finally {
      busy.set(false)
    }
  }

  return {
    name: name.get,
    description: description.get,
    nameChange: (value: string) => {
      name.set(value)
    },
    descriptionChange: (value: string) => {
      description.set(value)
    },
    blur: () => {},
    error: error.get,
    busy: busy.get,
    submit,
    title: () => (team() ? "Edit team" : "Create team"),
    mode: () => (team() ? formMode.edit : formMode.add),
    cancelHref: () =>
      team()
        ? teamPageDemoHref("detail", { orgHandle: orgHandle(), teamId: team()!.teamId })
        : teamPageDemoHref("list", { orgHandle: orgHandle() }),
    parent: () => orgHandle() ?? team()?.orgId,
    nameConfig: { ...formFieldConfigs.name, required: true, schema: teamDataSchema.entries.name },
    descriptionConfig: { ...formFieldConfigs.description, schema: teamDataSchema.entries.description },
  }
}
