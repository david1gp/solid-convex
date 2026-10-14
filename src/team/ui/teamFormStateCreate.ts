import { createEffect, untrack } from "solid-js"
import * as a from "valibot"
import { api } from "#convex/_generated/api.js"
import { userSessionSignal, userTokenGet } from "#src/auth/ui/signals/userSessionSignal.ts"
import { teamDataSchema } from "#src/team/model/teamDataSchema.ts"
import type { Team } from "#src/team/model/teamSchema.ts"
import { teamHrefGet } from "#src/team/ui/teamHrefGet.ts"
import { teamStorageRead } from "#src/team/ui/teamStorageRead.ts"
import { teamStorageWriterCreate } from "#src/team/ui/teamStorageWriterCreate.ts"
import { formFieldConfigs } from "#src/ui/form/formFieldConfigs.ts"
import { mutationCreate } from "#src/utils/convex_client/mutationCreate.ts"
import { navigateTo } from "#src/utils/router/navigateTo.ts"
import { formMode } from "#ui/input/form/formMode.ts"
import { createSignalObject } from "#ui/utils/createSignalObject.ts"

export function teamFormStateCreate(orgHandle: () => string | undefined, team: () => Team | undefined) {
  const name = createSignalObject("")
  const description = createSignalObject("")
  const error = createSignalObject("")
  const busy = createSignalObject(false)
  const create = mutationCreate(api.team.teamCreateMutation)
  const edit = mutationCreate(api.team.teamEditMutation)
  const writer = teamStorageWriterCreate()
  const key = () =>
    `team/draft/${userSessionSignal.get()?.profile.userId ?? ""}/${orgHandle() ?? "global"}/${team()?.teamId ?? "create"}`
  const draftSchema = a.object({
    name: a.union([teamDataSchema.entries.name, a.literal("")]),
    description: teamDataSchema.entries.description,
  })
  let loadedKey: string | undefined
  createEffect(() => {
    const draftKey = key()
    if (loadedKey === draftKey) return
    loadedKey = draftKey
    untrack(() => {
      const current = team()
      const draft = teamStorageRead(draftKey, draftSchema)
      name.set(draft.success ? draft.data.name : (current?.name ?? ""))
      description.set(draft.success ? (draft.data.description ?? "") : (current?.description ?? ""))
    })
  })
  const saveDraft = () => writer.save(key(), { name: name.get(), description: description.get() })
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
      const result = current
        ? await edit({ token: userTokenGet(), teamId: current.teamId, orgHandle: orgHandle(), ...parsed.output })
        : await create({ token: userTokenGet(), orgHandle: orgHandle(), ...parsed.output })
      if (!result.success) {
        error.set(result.errorMessage)
        return
      }
      writer.clear(key())
      navigateTo(teamHrefGet("detail", orgHandle(), current?.teamId ?? String(result.data)))
    } catch (cause) {
      error.set("Unable to save team. Please try again.")
      console.error("teamFormSubmit", cause)
    } finally {
      busy.set(false)
    }
  }
  return {
    name: name.get,
    description: description.get,
    nameChange: (value: string) => {
      name.set(value)
      saveDraft()
    },
    descriptionChange: (value: string) => {
      description.set(value)
      saveDraft()
    },
    blur: saveDraft,
    error: error.get,
    busy: busy.get,
    submit,
    title: () => (team() ? "Edit team" : "Create team"),
    mode: () => (team() ? formMode.edit : formMode.add),
    cancelHref: () => (team() ? teamHrefGet("detail", orgHandle(), team()!.teamId) : teamHrefGet("list", orgHandle())),
    parent: () => orgHandle() ?? team()?.orgId,
    nameConfig: { ...formFieldConfigs.name, required: true, schema: teamDataSchema.entries.name },
    descriptionConfig: { ...formFieldConfigs.description, schema: teamDataSchema.entries.description },
  }
}
