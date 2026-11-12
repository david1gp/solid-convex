import { Show } from "solid-js"
import type { Project } from "#src/project/model/projectSchema.ts"
import { ProjectForm } from "#src/project/ui/ProjectForm.tsx"
import { projectEditPageStateCreate } from "#src/project/ui/projectEditPageStateCreate.ts"
import { projectFormStateCreate } from "#src/project/ui/projectFormStateCreate.ts"
import { PageWrapper } from "#ui/static/page/PageWrapper.jsx"

export function ProjectEditPage(p: {
  demo?: {
    orgHandle: () => string | undefined
    teamId: () => string | undefined
    project: () => Project | undefined
    form: ReturnType<typeof projectFormStateCreate>
  }
}) {
  if (p.demo) {
    const demo = p.demo
    return (
      <PageWrapper>
        <Show when={demo.project()} fallback={<p>Project not found in demo fixtures.</p>}>
          {(project) => (
            <ProjectForm
              orgHandle={demo.orgHandle()}
              teamId={demo.teamId()}
              project={project()}
              demoState={demo.form}
            />
          )}
        </Show>
      </PageWrapper>
    )
  }
  const state = projectEditPageStateCreate()
  return (
    <PageWrapper>
      <Show when={state.loading()}>
        <p class="p-4 text-sm text-muted-foreground" role="status">
          Loading project…
        </p>
      </Show>
      <Show when={state.error()}>
        <p class="p-4 text-sm text-destructive" role="alert">
          {state.error()}
        </p>
      </Show>
      <Show when={state.project()}>
        {(project) => <ProjectForm orgHandle={state.orgHandle()} teamId={state.teamId()} project={project()} />}
      </Show>
    </PageWrapper>
  )
}
