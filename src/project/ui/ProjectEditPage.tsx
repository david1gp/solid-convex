import { Show } from "solid-js"
import { ProjectForm } from "#src/project/ui/ProjectForm.tsx"
import { projectEditPageStateCreate } from "#src/project/ui/projectEditPageStateCreate.ts"
import { PageWrapper } from "#ui/static/page/PageWrapper.jsx"

export function ProjectEditPage() {
  const state = projectEditPageStateCreate()
  return (
    <PageWrapper>
      <Show when={state.loading()}>
        <p class="p-4" role="status">
          Loading project…
        </p>
      </Show>
      <Show when={state.error()}>
        <p class="p-4 text-destructive" role="alert">
          {state.error()}
        </p>
      </Show>
      <Show when={state.project()}>
        {(project) => <ProjectForm orgHandle={state.orgHandle()} teamId={state.teamId()} project={project()} />}
      </Show>
    </PageWrapper>
  )
}
