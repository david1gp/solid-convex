import { useNavigate } from "@tanstack/solid-router"
import * as a from "valibot"
import type { Project } from "#src/project/model/projectSchema.ts"
import { projectDataSchema } from "#src/project/model/projectDataSchema.ts"
import { projectPageDemoFixturesGet } from "#src/project/ui/demo/projectPageDemoFixturesGet.ts"
import { projectPageDemoHref } from "#src/project/ui/demo/projectPageDemoHref.ts"
import { projectFormStateCreate } from "#src/project/ui/projectFormStateCreate.ts"
import { formFieldConfigs } from "#src/ui/form/formFieldConfigs.ts"
import { formMode } from "#ui/input/form/formMode.ts"
import { createSignalObject } from "#ui/utils/createSignalObject.ts"

/** Local-only project form state: same interface as the real form, no Convex or storage. */
export function projectFormDemoStateCreate(
  teamId: () => string | undefined,
  orgHandle: () => string | undefined,
  project: () => Project | undefined,
): ReturnType<typeof projectFormStateCreate> {
  const navigate = useNavigate()
  const fixtures = projectPageDemoFixturesGet()
  const name = createSignalObject(project()?.name ?? "")
  const description = createSignalObject(project()?.description ?? "")
  const error = createSignalObject("")
  const busy = createSignalObject(false)

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
      const saved = current
        ? (fixtures.edit(current.projectId, parsed.output) ?? current)
        : fixtures.add({ ...parsed.output, teamId: targetTeamId })
      await navigate({
        to: projectPageDemoHref("detail", {
          orgHandle: orgHandle(),
          teamId: targetTeamId,
          projectId: saved.projectId,
        }),
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
    title: () => (project() ? "Edit project" : "Create project"),
    mode: () => (project() ? formMode.edit : formMode.add),
    cancelHref: () =>
      project()
        ? projectPageDemoHref("detail", {
            orgHandle: orgHandle(),
            teamId: project()?.teamId ?? teamId(),
            projectId: project()!.projectId,
          })
        : projectPageDemoHref("list", { orgHandle: orgHandle(), teamId: teamId() }),
    parent: () => teamId() ?? project()?.teamId,
    nameConfig: { ...formFieldConfigs.name, required: true, schema: projectDataSchema.entries.name },
    descriptionConfig: { ...formFieldConfigs.description, schema: projectDataSchema.entries.description },
  }
}
