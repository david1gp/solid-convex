import { Show } from "solid-js"
import { ProjectListSection } from "#src/project/ui/ProjectListSection.tsx"
import { projectListPageStateCreate } from "#src/project/ui/projectListPageStateCreate.ts"
import { LinkButtonInternal } from "#ui/interactive/link/LinkButton.jsx"
import { PageWrapper } from "#ui/static/page/PageWrapper.jsx"

export function ProjectListPage() {
  const state = projectListPageStateCreate()
  return (
    <PageWrapper>
      <nav aria-label="Breadcrumb" class="px-4 pt-4 flex gap-2">
        <LinkButtonInternal to="/org">Organizations</LinkButtonInternal>
        <Show when={state.orgHandle()}>
          <LinkButtonInternal to={state.orgHref()}>{state.orgHandle()}</LinkButtonInternal>
        </Show>
        <Show when={state.teamId()}>
          <LinkButtonInternal to={state.teamHref()}>Team</LinkButtonInternal>
        </Show>
      </nav>
      <ProjectListSection orgHandle={state.orgHandle()} teamId={state.teamId()} />
    </PageWrapper>
  )
}
