import { createEffect, untrack } from "solid-js"
import * as a from "valibot"
import { api } from "#convex/_generated/api.js"
import type { Id } from "#convex/_generated/dataModel.js"
import { userSessionSignal, userTokenGet } from "#src/auth/ui/signals/userSessionSignal.ts"
import { projectDataSchema } from "#src/project/model/projectDataSchema.ts"
import type { Project } from "#src/project/model/projectSchema.ts"
import { projectHrefGet } from "#src/project/ui/projectHrefGet.ts"
import { projectStorageRead } from "#src/project/ui/projectStorageRead.ts"
import { projectStorageWriterCreate } from "#src/project/ui/projectStorageWriterCreate.ts"
import { formFieldConfigs } from "#src/ui/form/formFieldConfigs.ts"
import { mutationCreate } from "#src/utils/convex_client/mutationCreate.ts"
import { navigateTo } from "#src/utils/router/navigateTo.ts"
import { formMode } from "#ui/input/form/formMode.ts"
import { createSignalObject } from "#ui/utils/createSignalObject.ts"

export function projectFormStateCreate(
  teamId: () => string | undefined,
  orgHandle: () => string | undefined,
  project: () => Project | undefined,
) {
  const name = createSignalObject("")
  const description = createSignalObject("")
  const error = createSignalObject("")
  const busy = createSignalObject(false)
  const create = mutationCreate(api.project.projectCreateMutation)
  const edit = mutationCreate(api.project.projectEditMutation)
  const writer = projectStorageWriterCreate()
  const key = () =>
    `project/draft/${userSessionSignal.get()?.profile.userId ?? ""}/${teamId() ?? project()?.teamId ?? "noteam"}/${project()?.projectId ?? "create"}`
  const draftSchema = a.object({
    name: a.union([projectDataSchema.entries.name, a.literal("")]),
    description: projectDataSchema.entries.description,
  })
  let loadedKey: string | undefined
  createEffect(
    () => key(),
    (draftKey) => {
      if (loadedKey === draftKey) return
      loadedKey = draftKey
      untrack(() => {
        const current = project()
        const draft = projectStorageRead(draftKey, draftSchema)
        name.set(draft.success ? draft.data.name : (current?.name ?? ""))
        description.set(draft.success ? (draft.data.description ?? "") : (current?.description ?? ""))
      })
    },
  )
  const saveDraft = () => writer.save(key(), { name: name.get(), description: description.get() })
  const submit = async (event: SubmitEvent) => {
    event.preventDefault()
    if (busy.get()) return
    const parsed = a.safeParse(projectDataSchema, {
      name: name.get().trim(),
      description: description.get().trim() || undefined,
    })
    if (!parsed.success) {
      error.set(a.summarize(parsed.issues))
      return
    }
    const current = project()
    const targetTeamId = current?.teamId ?? teamId()
    if (!targetTeamId) {
      error.set("Choose a team before creating a project.")
      return
    }
    busy.set(true)
    error.set("")
    try {
      const result = current
        ? await edit({
            token: userTokenGet(),
            projectId: current.projectId,
            teamId: current.teamId,
            orgHandle: orgHandle(),
            ...parsed.output,
          })
        : await create({
            token: userTokenGet(),
            teamId: targetTeamId as Id<"teams">,
            orgHandle: orgHandle(),
            ...parsed.output,
          })
      if (!result.success) {
        error.set(result.errorMessage)
        return
      }
      writer.clear(key())
      navigateTo(
        projectHrefGet("detail", {
          orgHandle: orgHandle(),
          teamId: targetTeamId,
          projectId: current?.projectId ?? String(result.data),
        }),
      )
    } catch (cause) {
      error.set("Unable to save project. Please try again.")
      console.error("projectFormSubmit", cause)
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
    title: () => (project() ? "Edit project" : "Create project"),
    mode: () => (project() ? formMode.edit : formMode.add),
    cancelHref: () =>
      project()
        ? projectHrefGet("detail", {
            orgHandle: orgHandle(),
            teamId: project()?.teamId ?? teamId(),
            projectId: project()!.projectId,
          })
        : projectHrefGet("list", { orgHandle: orgHandle(), teamId: teamId() }),
    parent: () => teamId() ?? project()?.teamId,
    nameConfig: { ...formFieldConfigs.name, required: true, schema: projectDataSchema.entries.name },
    descriptionConfig: { ...formFieldConfigs.description, schema: projectDataSchema.entries.description },
  }
}
