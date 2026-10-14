import { Show } from "solid-js"
import { TeamListSection } from "#src/team/ui/TeamListSection.tsx"
import { teamListPageStateCreate } from "#src/team/ui/teamListPageStateCreate.ts"
import { LinkButtonInternal } from "#ui/interactive/link/LinkButton.jsx"
import { PageWrapper } from "#ui/static/page/PageWrapper.jsx"

export function TeamListPage() {
  const state = teamListPageStateCreate()
  return (
    <PageWrapper>
      <nav aria-label="Breadcrumb" class="px-4 pt-4 flex gap-2">
        <LinkButtonInternal to="/org">Organizations</LinkButtonInternal>
        <Show when={state.orgHandle()}>
          <LinkButtonInternal to={state.orgHref()}>{state.orgHandle()}</LinkButtonInternal>
        </Show>
      </nav>
      <TeamListSection orgHandle={state.orgHandle()} />
    </PageWrapper>
  )
}
